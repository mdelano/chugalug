'use strict'

// Local deps
var elasticSearchDao = require('./dao/elasticSearchDao');

// Package deps
var bunyan     = require('bunyan');


module.exports = function(args) {
    // Initialize the logger. If we don't have a logger we'll instantiate a new one
    var logger = args.logger ? args.logger : bunyan.createLogger({name: "chugalug"});

    var event = JSON.parse(args.event);

	elasticSearchDao.save(event, args.success, args.error);
}




















