"use strict";

var currentStatus = null,
	cluster = require("cluster"),
	Worker = require(__dirname + "/worker.js"),
	Status = require(__dirname + "/status.js");

exports.start = function(config) {
	if (currentStatus === null) {
		currentStatus = new Status(config);

		currentStatus.on("serverStopped", function() {
			currentStatus = null;
		});

		if (cluster.isMaster) {
			currentStatus.startServer();
		}
	}
	return currentStatus;
};
