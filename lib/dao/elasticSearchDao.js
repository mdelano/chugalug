'use strict'

/**
* This module is responsible for persisting events to elastic search.
* The events must have the event name at the root of the event
* object as "eventName". Additionally, the ElasticSearch server list
* must exist in the environment variable MEDIASILO_ES_SERVERS
*
* In the event we scale our ES cluster this module is configured to
* check for new nodes on startup and it will recheck every 5 minutes.
**/

var elasticsearch	= require('elasticsearch');

// The bunyan wrapper allows us to override default elasticsearch
// client logging
var bunyanLoggerWrapper = require('../util/bunyanLoggerWrapper');

// The ElasticSearch client configuration. To configure further, reference
// the documentation found here:
// http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/configuration.html
var client = new elasticsearch.Client({
	apiVersion:"1.3",
  	host: process.env.MEDIASILO_ES_SERVERS,
  	port:80,
  	log: bunyanLoggerWrapper
});

// This is the save implementation. Objects that have a save signature of
// "save(object, [successCallback], [errorCallback])" can be used by the
// event handler to persist events. So, if you want to get really crazy
// and start saving events to MemSQL just implement it with this signature
// and have the event handler call it.
module.exports.save = function(object, successCallback, errorCallback, logger) {
	client.create({
	  index: "events",
	  type: object.eventName,
	  body: object
	}, function (error, response) {
	  if(error) {
	  	errorCallback({error: error, response: response});
	  }
	  else {
	  	successCallback(response);
	  }
	});
}
