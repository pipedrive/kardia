var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon');

describe('Server', function() {
	it('Should start server and related processes', function(next) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12809 });

		clock.tick(100);

		request('http://127.0.0.1:12809', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (!data || !data.pid || !data.service) {
				fail('Expected Kardia to respond with JSON data, including "pid", "service", instead got: '+body);
			}

			if (data.service != serviceName) {
				fail('Kardia responded with incorrect service name.');
			}

			if (data.pid != process.pid) {
				fail('Kardia responded with incorrect pid.');
			}

			kardiaInstance.stopServer();

			next();
		});
	});

	it('Should start server on default port if port is omitted', function(next) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName });

		clock.tick(100);

		request('http://127.0.0.1:12900', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (!data || !data.pid || !data.service) {
				fail('Expected Kardia to respond with JSON data, including "pid", "service", instead got: '+body);
			}

			if (data.service != serviceName) {
				fail('Kardia responded with incorrect service name.');
			}

			if (data.pid != process.pid) {
				fail('Kardia responded with incorrect pid.');
			}

			kardiaInstance.stopServer();

			next();
		});
	});
});