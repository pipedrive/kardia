(function() {
	'use strict';

	var dgram = require('dgram'),
		started = false,
		fluentdConfig = {},
		cache = {};

	exports.incrementCounter = function (config, name, value) {
		if (!config || !config.name || !config.fluentd || !config.fluentd.host || !config.fluentd.port) {
			return;
		}

		cache[config.name.replace(/\s/g, '-') + '.' + name + '.counter'] = Number(value);

		if (!started) {
			fluentdConfig = config.fluentd;
			start();
		}
	};

	function start() {
		if (started) {
			return;
		}
		started = true;

		setInterval(send, fluentdConfig.sendInterval || 1000).unref();

		send();
	}

	function send() {
		var message = new Buffer(JSON.stringify(cache));

		cache = {};
		var client = dgram.createSocket('udp4');

		client.on('error', function () {
			client.close();
		});

		client.send(message, 0, message.length, fluentdConfig.port, fluentdConfig.host, function () {
			client.close();
		});
	}
})();