"use strict";
var dgram = require('dgram');

exports.send = function (config, name, value) {
	if (!config.name || !config.fluent || !config.fluent.host || !config.fluent.port) {
		return;
	}

	var json = {};
	json[config.name.replace(/\s/g, '-') + '.' + name + '.counter'] = Number(value);

	var message = new Buffer(JSON.stringify(json)),
		client = dgram.createSocket('udp4');

	client.on('error', function () {
		client.close();
	});

	client.send(message, 0, message.length, config.fluent.port, config.fluent.host, function () {
		client.close();
	});
};
