var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon');

describe('Counters', function() {
	it('Should support modifying counters', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12810 });

		kardiaInstance.increment('test-counter', 1);
		kardiaInstance.increment('test-counter', 3);
		kardiaInstance.increment('test-counter', 0);
		kardiaInstance.decrement('test-counter', 1);

		clock.tick(1000);
		request('http://127.0.0.1:12810', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (!data.counters || !data.counters['test-counter']) {
				fail('Expected test-counter to exist in response from Kardia');
			}

			if (data.counters['test-counter'] !== 4) {
				fail('Expected test-counter to equal 4 in response from Kardia');
			}

			kardiaInstance.stopServer();

			done();
		});
	});
});