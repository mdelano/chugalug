'use strict'

/**
 * This file is responsible for consuming the event queue and passing
 * the events to an event handler where they can be routed to various
 * callback strategies.
 *
 * Thanks https://github.com/bigluck/sqs-queue-parallel for this useful package.
 *
 * MediaSilo
 * Mike Delano
 *
 * @type {*}
 */

// Local deps
var eventHandler            = require('./eventHandler');

// Package deps
var moment                  = require('moment');
var sqsQueueParallel        = require('sqs-queue-parallel');
var bunyan                  = require('bunyan');

module.exports = function(args) {

    // Initialize the logger. If we don't have a logger we'll instantiate a new one
    var logger = args.logger ? args.logger : bunyan.createLogger({name: "chugalug"});

    // This queue runner configuration will set up N concurrent runners each of which
    // can receive up to N messages specified by the parameters concurrency and
    // maxNumberOfMessages respectively
    var queue = new sqsQueueParallel({
        name: process.env.MEDIASILO_AWS_SQSQ,
        maxNumberOfMessages: 2,
        concurrency: 5,
        debug:false
    });

    // Event binding for receiving a new queue message
    queue.on('message', function (queueMessage, next)
    {
      try {
        logger.debug('Received new event message: ', queueMessage);
        GLOBAL.events_statistics.events_total_attempted += 1;
        GLOBAL.events_statistics.events_last_attempted = moment();
        // Delegate the queue message to our event handler
        eventHandler({
            event:queueMessage.data.Message,
            success: function(response){
                tryLogEvent(JSON.parse(queueMessage.data.Message));
                queueMessage.deleteMessage(); // Clean up after ourselves to prevent other consumers from handling this message as well
                GLOBAL.events_statistics.events_total_handled += 1;
                GLOBAL.events_statistics.events_last_handled = moment();
                queueMessage.next();
            },
            error: function(response){
                logger.error('Error handling event: ', response);
                GLOBAL.events_statistics.events_total_unhandled += 1;
                GLOBAL.events_statistics.events_last_unhandled = moment();
                queueMessage.next();
            },
            logger: logger
        });
      }
      catch(err) {
        logger.error(err);
      }

    });

    // Event binding for failing to receive a new queue message
    queue.on('error', function (err)
    {
        logger.error('There was an error reading an event from the queue: ', err);
    });

    var tryLogEvent = function(eventObject) {
      if(!eventObject.eventName) {
        return;
      }

      if(eventObject.user && eventObject.user.userName) {
        logger.info(eventObject.user.userName, 'triggered', eventObject.eventName);
        return;
      }

      logger.info(eventObject.eventName, 'triggered');
    }
}
