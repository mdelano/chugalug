'use strict'

/**
 * The purpose of this server is to poll for events from an SQS queue and persist the events to a database
 *
 * In order for this server to run the following env vars need to be configured:
 *
 * env AWS_ACCESS_KEY_ID=<YOUR ACCESS KEY>
 * env AWS_SECRET_ACCESS_KEY=<YOUR SECRET>
 * env AWS_REGION=<THE REGION OF YOUR SQS Q>
 * env MEDIASILO_AWS_SQSQ=<THE NAME OF YOUR Q>
 * env MEDIASILO_ES_SERVERS=<ARRAY OF ES SERVERS>
 *
 * To run this server as a daemon see chugalug.init. This can be used os an upstart
 * script on a deb server
 *
 *
 * Company: MediaSilo
 *
 * Author: Mike Delano
 *
 */

 // This is a global object for managing the stats of the events for this event worker.
 // I know, I know. Globals max the most sense for this so chill.
GLOBAL.events_statistics = {
    events_total_attempted  : 0,
    events_last_attempted   : 0,
    events_total_handled    : 0,
    events_last_handled     : 0,
    events_total_unhandled  : 0,
    events_last_unhandled   : 0
}

var moment                  = require('moment');
var queueConsumer           = require('chugalug-lib').queueConsumer;
var bunyan                  = require('bunyan');
var bsyslog                 = require('bunyan-syslog');
var prettyStream            = require('bunyan-prettystream');
var restify                 = require('restify');
var restify                 = require('restify');

var appName = "chugalug"

var args = {}
process.argv.forEach(function (val, index, array) {
  var argKv = val.split("=");
  args[argKv[0]] = argKv[1];
});

console.log(args);

// Configure logger
var prettyStdOut = new prettyStream();
prettyStdOut.pipe(process.stdout);
var logger = bunyan.createLogger({
    name: appName,
    streams: [{ // For logging to stdout
        level: 'debug',
        type: 'raw',
        stream: prettyStdOut
    },
    { // For logging to syslog
        level: 'debug',
        type: 'raw',
        stream: bsyslog.createBunyanStream({
            type: 'sys',
            facility: bsyslog.local0,
            host: '127.0.0.1',
            port: 514
        })
    }]
});
var logLevel = args.logLevel || 'debug'
logger.level(logLevel);

// Let's get this party started and start eating some event messages
logger.info("Starting " + appName);

logger.debug("AWS_ACCESS_KEY_ID="+process.env.AWS_ACCESS_KEY_ID);
logger.debug("AWS_SECRET_ACCESS_KEY="+process.env.AWS_SECRET_ACCESS_KEY);
logger.debug("AWS_REGION="+process.env.AWS_REGION);
logger.debug("MEDIASILO_AWS_SQSQ="+process.env.MEDIASILO_AWS_SQSQ);
logger.debug("MEDIASILO_ES_SERVERS="+process.env.MEDIASILO_ES_SERVERS);

queueConsumer({
    logger:logger
});



// We also want to set up a web server for getting the status of this event consumer
function status(req, res, next) {
  if(req.username != 'statuscake' && req.password != 'isthisthingon?!?!') {
    res.send(403, new Error('You shall not pass!'))
  }

  status = {};

  if(GLOBAL.events_statistics.events_last_handled > moment().subtract(30, 'minute')) {
    status.state = 'cruisin'
  }
  else if(GLOBAL.events_statistics.events_last_handled < moment().subtract(30, 'minute')) {
    status.state = 'no recent success'
  }
  else if(GLOBAL.events_statistics.events_last_attempted < moment().subtract(30, 'minute')) {
    status.state = 'not polling'
  }
  else if((GLOBAL.events_statistics.events_total_handled / GLOBAL.events_statistics.events_total_attempted) < 0.95) {
    status.state = 'high errors'
  }

  status.statistics = GLOBAL.events_statistics;

  res.send(status);
  next();
}

var server = restify.createServer();
server.use(restify.authorizationParser());
server.get('/status/', status);

var port = process.env.PORT || 8080;
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
