(function () {
	'use strict';

	var dgram = require('dgram'),
		started = false,
		fluentdConfig = {},
		cache = {};

	exports.incrementCounter = function (config, name, value) {
		if (!config || !config.name || !config.fluentd || !config.fluentd.host || !config.fluentd.port) {
			return;
		}

		var cache_key = config.name.replace(/[^0-9a-zA-Z]/g, '-') + '.' + name.replace(/[^0-9a-zA-Z]/g, '-') + '.counter';
		cache[cache_key] = (cache[cache_key] || 0) + Number(value);

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
		var messageJson = JSON.stringify(cache);
		if (messageJson === '{}') {
			return;
		}

		var message = new Buffer(messageJson),
			client = dgram.createSocket('udp4');

		cache = {};

		client.on('error', function () {
			client.close();
		});

		client.send(message, 0, message.length, fluentdConfig.port, fluentdConfig.host, function () {
			client.close();
		});
	}
})();