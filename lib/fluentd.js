"use strict";
var dgram = require('dgram');

exports.incrementCounter = function (config, name, value) {
	if (!config || !config.name || !config.fluentd || !config.fluentd.host || !config.fluentd.port) {
		return;
	}

	var json = {};
	json[config.name.replace(/\s/g, '-') + '.' + name + '.counter'] = Number(value);

	var message = new Buffer(JSON.stringify(json)),
		client = dgram.createSocket('udp4');

	client.on('error', function () {
		client.close();
	});

	client.send(message, 0, message.length, config.fluentd.port, config.fluentd.host, function () {
		client.close();
	});
};
