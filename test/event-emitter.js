var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon');

describe('Event emitter', function() {
	it('Should emit events upon receiving requests', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12829 });

		clock.tick(100);

		kardiaInstance.on('serverRequest', function() {
			kardiaInstance.stopServer();
			done();
		});

		request('http://127.0.0.1:12829', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);
		});
	});

	it('Should emit "listening" event with proper host and port', function(next) {
		var Kardia = require('../'),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12814, host: '127.0.0.1' });

		kardiaInstance.server.on('listening', function(){
			var connectionKey = this._connectionKey;
			if (!connectionKey.match(/:127\.0\.0\.1:/)) {
				fail('Kardia ignore option host');
			}
			if (!connectionKey.match(/:12814$/)) {
				console.log('fail1');
				fail('Kardia ignore option port');
			}
			kardiaInstance.stopServer();

			next();
		});
	});

	it('Should support removing event listeners', function(next) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			eventFired = false,
			kardiaInstance = Kardia.start({ name: serviceName, port: 12829 });

		clock.tick(100);

		kardiaInstance.on('serverRequest', function() {
			if (eventFired) {
				fail('Event listener should have been removed!');
			}
			eventFired = true;
			kardiaInstance.removeListener('serverRequest');
			makeCheck(false);
			
		});

		makeCheck(true);

		function makeCheck(keepAlive) {
			request('http://127.0.0.1:12829', function(err, res, body) {
				if (err) {
					throw err;
				}
				var data = JSON.parse(body);
				if (!keepAlive) {
					kardiaInstance.stopServer();
					next();
				}
			});
		}
	});
});