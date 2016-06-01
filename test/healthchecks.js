var fail = require(__dirname + '/lib/fail.js'),
	async = require('async'),
	request = require('request'),
	sinon = require('sinon');

describe('Health checks', function() {
	it('Should support health check endpoints', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + Math.round(Math.random() * 1000),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12834 });

		kardiaInstance.set('test-value', { specific: 'value' });

		var health = 'good',
			incrediblySpecialBadHealthReasonError = 'I\'m not feeling well!',
			testTimeoutInSeconds = 1;

		kardiaInstance.registerHealthcheck({
			handler: function(callback) {
				if (health === 'good') {
					callback();
				} else if (health === 'bad') {
					callback(new Error(incrediblySpecialBadHealthReasonError));
				} else {
					clock.tick(5000);
				}
			},
			timeout: testTimeoutInSeconds
		});

		var checkAndAssertHealth = function(expectedSuccess, expectedErrorMessage) {
			return function(next) {
				request('http://127.0.0.1:12834/health', function(err, res, body) {
					if (err) {
						throw err;
					}
					var data = JSON.parse(body);

					if (!data) {
						fail('Expected health check endpoint to respond with a JSON.');
					}

					if (data.success !== expectedSuccess) {
						fail('Expected health check endpoint to respond with success: ' + (expectedSuccess ? 'true' : 'false'));
					}

					if (expectedSuccess === false) {
						if (!data.error) {
							fail('Expected error message to be present in health check response JSON');
						}

						if (data.error.indexOf(expectedErrorMessage) < 0) {
							fail('Expected health check endpoint to respond with error: "' + expectedErrorMessage + '"');
						}
					}
					
					next();
				});
			};
		};

		clock.tick(100);
		async.series([

			// 1. first run the health check, assuming everything is fine
			checkAndAssertHealth(true),

			// 2. then make things bad... very, very bad.
			function(next) {
				health = 'bad';
				next();
			},

			// 3. expect them to be bad via the health check
			checkAndAssertHealth(false, incrediblySpecialBadHealthReasonError),

			// 4. yup. they were bad. next up, make no response to health check and expect kardia timeout to kick in
			function(next) {
				health = 'timeout';
				next();
			},

			// 5. assert timeout indeed kicked in
			checkAndAssertHealth(false, 'timed out (> ' + testTimeoutInSeconds + ' sec)'),

			// 6. clean up
			function(next) {
				kardiaInstance.stopServer();
				next();
			},

			// 7. then finish the test
			function() {
				done();
			}
		]);
	});

	it('Should support service name match and fail when name does not match', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + Math.round(Math.random() * 1000),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12809 });

		kardiaInstance.registerHealthcheck({
			handler: function(callback) {
				callback();
			},
			timeout: 2
		});

		var checkAndAssertHealth = function(expectedSuccess, expectedErrorMessage) {
			return function(next) {
				request('http://127.0.0.1:12809/health?service_name=' + (expectedSuccess ? encodeURIComponent(serviceName) : 'someotherservice'), function(err, res, body) {
					if (err) {
						throw err;
					}
					var data = JSON.parse(body);

					if (!data) {
						fail('Expected health check endpoint to respond with a JSON.');
					}

					if (data.success !== expectedSuccess) {
						fail('Expected health check endpoint to respond with success: ' + (expectedSuccess ? 'true' : 'false'));
					}

					if (expectedSuccess === false) {
						if (!data.error) {
							fail('Expected error message to be present in health check response JSON');
						}

						if (data.error.indexOf(expectedErrorMessage) < 0) {
							fail('Expected health check endpoint to respond with error: "' + expectedErrorMessage + '"');
						}
					}
					
					next();
				});
			};
		};

		clock.tick(100);
		async.series([

			// 1. first run the health check, assuming everything is fine
			checkAndAssertHealth(true),

			// 2. expect them to be bad via the health check when wrong service name is given
			checkAndAssertHealth(false, 'Service name mismatch'),

			// 3. finish the test
			function() {
				kardiaInstance.stopServer();
				done();
			}
		]);
	});

	it('Should support registering health check endpoint with the .start() call', function(done) {
		var clock = sinon.useFakeTimers(),
			Kardia = require('../'),
			serviceName = 'test-' + Math.round(Math.random() * 1000),
			healthcheckHandler = function(callback) {
				var kardiaData = kardiaInstance.generateStatus(),
					err = null;
				if (!kardiaData.values['test-value']) {
					err = new Error('Expected test-value');
				}
				callback(err);
			},
			kardiaInstance = Kardia.start({
				name: serviceName,
				port: 12811,
				healthcheck: healthcheckHandler
			});

		kardiaInstance.set('test-value', { specific: 'value' });

		clock.tick(100);
		request('http://127.0.0.1:12811/health', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (!data) {
				fail('Expected health check endpoint to respond with a JSON.');
			}

			if (data.success !== true) {
				fail('Expected health check endpoint to respond with success: true');
			}

			kardiaInstance.stopServer();
			
			done();
		});
	});

	it('Should warn against unregistered health checks', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + Math.round(Math.random() * 1000),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12833 });

		kardiaInstance.set('test-value', { specific: 'value' });

		clock.tick(100);
		request('http://127.0.0.1:12833/health', function(err, res, body) {
			if (res.statusCode !== 500) {
				fail('Expected a an error 500 to be returned from health check endpoint');
			}

			kardiaInstance.stopServer();

			done();
		});
	});

	it('Should provide object for Consul health check registration', function(done) {
		var Kardia = require('../'),
			serviceName = 'test-' + Math.round(Math.random() * 1000),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12832 });

		kardiaInstance.set('test-value', { specific: 'value' });
		kardiaInstance.registerHealthcheck(sinon.spy());

		var consulParamsWithDefaults = kardiaInstance.getConsulHealthcheck();
		var consulParamsWithOptions = kardiaInstance.getConsulHealthcheck({
			interval: '5s',
			notes: 'test',
			service_id: '123'
		});

		consulParamsWithDefaults.interval.should.equal('10s');
		consulParamsWithDefaults.should.have.property('notes');
		consulParamsWithDefaults.http.should.equal('http://' + require('os').hostname() + ':12832/health?service_name=' + encodeURIComponent(serviceName));
		consulParamsWithDefaults.service_id.should.equal(serviceName);

		consulParamsWithOptions.interval.should.equal('5s');
		consulParamsWithOptions.notes.should.equal('test');
		consulParamsWithOptions.http.should.equal('http://' + require('os').hostname() + ':12832/health?service_name=' + encodeURIComponent(serviceName));
		consulParamsWithOptions.service_id.should.equal('123');

		kardiaInstance.stopServer();

		done();
	});
});