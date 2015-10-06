var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon');

describe('Values', function() {
	it('Should support modifying values', function(next) {
		var Kardia = require('../'),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12811 }),
			clock = sinon.useFakeTimers();

		clock.tick(100);

		kardiaInstance.set('test-value', { specific: 'value' });

		request('http://127.0.0.1:12811', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			// a little test that the server is in fact a new one, not the one from any of the previous tests:
			if (data.counters && data.counters['test-counter']) {
				fail('Did not expect test-counter to exist in response from Kardia');
			}

			if (!data.values || !data.values['test-value'] || typeof data.values['test-value'] !== 'object') {
				fail('Expected test-value to exist in response from Kardia. and be an object');
			}

			if (data.values['test-value'].specific !== 'value') {
				fail('Expected test-value[specific] to equal "value" in response from Kardia');
			}

			kardiaInstance.stopServer();

			next();
		});
	});
});