var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon');

describe('Throughput', function() {
	it('Should support calculating throughput', function(next) {
		var clock = sinon.useFakeTimers();

		var Kardia = require('../'),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12818 });

		clock.tick(100);

		var bumperIntervalMs = 337;

		var expectation = {
			sec: 0
		};

		var bumper = setInterval(function() {
			kardiaInstance.throughput('test~req');
			expectation.sec++;
			if (expectation.sec < Math.ceil(kardiaInstance.throughputCalculationStep * 1000 / bumperIntervalMs) + (kardiaInstance.throughputCalculationStep * 1000)) {
				clock.tick(bumperIntervalMs);
			}
		}, bumperIntervalMs);

		kardiaInstance.on('throughputIntervalRun', function() {
			clearInterval(bumper);

			request('http://127.0.0.1:12818', function(err, res, body) {
				if (err) {
					throw err;
				}
				var data = JSON.parse(body);

				if (!data || !data.throughput) {
					fail('Data not available');
				}

				if (!data.throughput['test~req']) {
					fail('Throughput data must contain "test~req", currently key missing');
				}

				if (!data.throughput['test~req'][kardiaInstance.throughputCalculationStep]) {
					fail('Expecting throughput calculated with the step of ' + kardiaInstance.throughputCalculationStep + ' seconds to be present, currently missing');
				}

				expectation.sec = expectation.sec / kardiaInstance.throughputCalculationStep;
				expectation.min = expectation.sec * 60;
				expectation.hour = expectation.sec * 3600;

				if (!data.throughput['test~req'][kardiaInstance.throughputCalculationStep].sec || data.throughput['test~req'][kardiaInstance.throughputCalculationStep].sec > expectation.sec || data.throughput['test~req'][kardiaInstance.throughputCalculationStep].sec < expectation.sec) {
					fail('Expecting "test~req" throughput per sec to be ' + expectation.sec + ', saw ' + data.throughput['test~req'][kardiaInstance.throughputCalculationStep].sec);
				}

				if (!data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min || data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min > expectation.min || data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min < expectation.min) {
					fail('Expecting "test~req" throughput per min to be ' + expectation.min + ', saw ' + data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min);
				}

				if (!data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min || data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min > expectation.min || data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min < expectation.min) {
					fail('Expecting "test~req" throughput per hour to be ' + expectation.hour + ', saw ' + data.throughput['test~req'][kardiaInstance.throughputCalculationStep].min);
				}

				kardiaInstance.clearThroughput('test~req');

				if (kardiaInstance.throughput['test~req']) {
					fail('Expecting "test~req" throughput to be cleared');
				}

				kardiaInstance.stopServer();
				next();
			});
		});

		clock.tick(bumperIntervalMs);

	});
});