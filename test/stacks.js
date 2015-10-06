var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon');

describe('Stacks', function() {
	it('Should support modifying stacks', function(next) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12812 });

		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 3);
		kardiaInstance.stack('test-stack15', 0);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 3);
		kardiaInstance.stack('test-stack15', 0);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 3);
		kardiaInstance.stack('test-stack15', 0);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 1);
		kardiaInstance.stack('test-stack15', 99);

		kardiaInstance.startStack('test-stack2', 2);
		kardiaInstance.stack('test-stack2', 1);
		kardiaInstance.stack('test-stack2', 1);
		kardiaInstance.stack('test-stack2', 99);

		clock.tick(100);
		request('http://127.0.0.1:12812', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (!data.stacks || !data.stacks['test-stack15']) {
				fail('Expected test-stack15 to exist in response from Kardia');
			}

			if (data.stacks['test-stack15'].length !== 15) {
				fail('Expected test-stack15 length to equal 15 in response from Kardia, saw ' + data.stacks['test-stack15'].length + ' instead');
			}

			if (!data.stacks || !data.stacks['test-stack2']) {
				fail('Expected test-stack2 to exist in response from Kardia');
			}

			if (data.stacks['test-stack2'].length !== 2) {
				fail('Expected test-stack2 length to equal 2 in response from Kardia, saw ' + data.stacks['test-stack2'].length + ' instead');
			}

			kardiaInstance.stopServer();

			next();
		});
	});
});