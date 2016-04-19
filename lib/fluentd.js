(function() {
	'use strict';

	var dgram = require('dgram'),
		client = dgram.createSocket('udp4'),
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

		client.on('error', function () {
			client.close();
		});

		setInterval(send, fluentdConfig.sendInterval || 1000).unref();
	}

	function send() {
		var message = new Buffer(JSON.stringify(cache));

		cache = {};

		client.send(message, 0, message.length, fluentdConfig.port, fluentdConfig.host, function () {
			client.close();
		});
	}
})();