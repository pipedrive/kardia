var fail = require(__dirname + "/../lib/fail.js"),
	async = require("async"),
	request = require("request");

module.exports = function(finalNext) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12834 });

	kardiaInstance.set("test-value", { specific: "value" });

	var health = "good",
		incrediblySpecialBadHealthReasonError = "I'm not feeling well!",
		testTimeoutInSeconds = 2;

	kardiaInstance.registerCheck({
		handler: function(callback) {
			if (health === "good") {
				callback(true);
			} else if (health === "bad") {
				callback(new Error(incrediblySpecialBadHealthReasonError));
			} else {
				// deliverately leave callback uncalled, thus forcing a timeout on Kardia
			}
		},
		timeout: testTimeoutInSeconds
	});

	var checkAndAssertHealth = function(expectedSuccess, expectedErrorMessage) {
		return function(next) {
			request("http://127.0.0.1:12834/check", function(err, res, body) {
				if (err) {
					throw err;
				}
				var data = JSON.parse(body);

				if (!data) {
					fail("Expected health check endpoint to respond with a JSON.");
				}

				if (data.success !== expectedSuccess) {
					fail("Expected health check endpoint to respond with success: " + (expectedSuccess ? "true" : "false"));
				}

				if (expectedSuccess === false) {
					if (!data.error) {
						fail("Expected error message to be present in health check response JSON");
					}

					if (data.error.indexOf(expectedErrorMessage) < 0) {
						fail("Expected health check endpoint to respond with error: \"" + expectedErrorMessage + "\"");
					}
				}
				
				next();
			});
		}
	};

	var expectingTimeoutTimeout = setTimeout(function() {
		fail("Expected a health check to respond under " + (testTimeoutInSeconds * 1000 + 300) + " ms");
	}, testTimeoutInSeconds * 1000 + 300);

	setTimeout(function() {
		async.series([

			// 1. first run the health check, assuming everything is fine
			checkAndAssertHealth(true),

			// 2. then make things bad... very, very bad.
			function(next) {
				health = "bad";
				next();
				console.log("Setting service health to bad");
			},

			// 3. expect them to be bad via the health check
			checkAndAssertHealth(false, incrediblySpecialBadHealthReasonError),

			// 4. yup. they were bad. next up, make no response to health check and expect kardia timeout to kick in
			function(next) {
				health = "timeout";
				next();
				console.log("Setting service health to so bad that it won't even respond to Kardia");
			},

			// 5. assert timeout indeed kicked in
			checkAndAssertHealth(false, "timed out (> 2 sec)"),

			// 6. clean up
			function(next) {
				console.log("Everything worked fine, finishing up");
				clearTimeout(expectingTimeoutTimeout);
				kardiaInstance.stopServer();
				next();
			},

			// 7. then finish the test
			function() {
				finalNext();
			}
		]);
	}, 100);
}