(function() {
	'use strict';

	var dgram = require('dgram'),
		client = dgram.createSocket('udp4'),
		started = false,
		cache = {};

	exports.incrementCounter = function (config, name, value) {
		if (!config || !config.name || !config.fluentd || !config.fluentd.host || !config.fluentd.port) {
			return;
		}

		cache[config.name.replace(/\s/g, '-') + '.' + name + '.counter'] = Number(value);

		if (!started) {
			start();
		}
	};

	function start() {
		if (started) {
			return;
		}
		started = true;

		client.on('error', function () {
			client.close();
		});

		setInterval(send, config.fluentd.sendInterval || 1000);
	}

	function send() {
		var message = new Buffer(JSON.stringify(cache));

		cache = {};


		client.send(message, 0, message.length, config.fluentd.port, config.fluentd.host, function () {
			client.close();
		});
	}
})();