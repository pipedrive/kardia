var fail = require(__dirname + "/../lib/fail.js"),
	request = require("request");

module.exports = function(next) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12818 });

	setTimeout(function() {

		kardiaInstance.throughputCalculationStep = 1;

		var bumperIntervalMs = 150;

		var stopIfThroughputIntervalRunNotReceived = setTimeout(function() {
			fail("Expected to have reeived a 'throughputIntervalRun' event from Kardia by now");
		}, 9000);

		var expectation = { sec: 0 }

		var bumper = setInterval(function() {
			kardiaInstance.throughput("test~req");
			expectation.sec++;
			console.log('Generating throughput');
		}, bumperIntervalMs);

		kardiaInstance.on("throughputIntervalRun", function() {
			clearInterval(bumper);
			clearInterval(stopIfThroughputIntervalRunNotReceived);

			setTimeout(function() {
				request("http://127.0.0.1:12818", function(err, res, body) {
					if (err) {
						throw err;
					}
					var data = JSON.parse(body);

					if (!data || !data.throughput) {
						fail("Data not available");
					}

					if (!data.throughput["test~req"]) {
						fail("Throughput data must contain 'test~req', currently key missing");
					}

					if (!data.throughput["test~req"][kardiaInstance.throughputCalculationStep]) {
						fail("Expecting throughput calculated with the step of " + kardiaInstance.throughputCalculationStep + " seconds to be present, currently missing");
					}

					expectation.sec = expectation.sec / kardiaInstance.throughputCalculationStep;
					expectation.min = expectation.sec * 60;
					expectation.hour = expectation.sec * 3600;

					if (!data.throughput["test~req"][kardiaInstance.throughputCalculationStep].sec || data.throughput["test~req"][kardiaInstance.throughputCalculationStep].sec > expectation.sec || data.throughput["test~req"][kardiaInstance.throughputCalculationStep].sec < expectation.sec) {
						fail("Expecting 'test~req' throughput per sec to be " + expectation.sec + ", saw " + data.throughput["test~req"][kardiaInstance.throughputCalculationStep].sec);
					}

					if (!data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min || data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min > expectation.min || data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min < expectation.min) {
						fail("Expecting 'test~req' throughput per min to be " + expectation.min + ", saw " + data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min);
					}

					if (!data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min || data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min > expectation.min || data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min < expectation.min) {
						fail("Expecting 'test~req' throughput per hour to be " + expectation.hour + ", saw " + data.throughput["test~req"][kardiaInstance.throughputCalculationStep].min);
					}

					kardiaInstance.stopServer();
					next();
				});
			}, 100);
		});

		
	}, 100);
}