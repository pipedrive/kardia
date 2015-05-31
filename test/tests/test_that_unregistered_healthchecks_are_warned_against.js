var fail = require(__dirname + "/../lib/fail.js"),
	request = require("request");

module.exports = function(next) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12833 });

	kardiaInstance.set("test-value", { specific: "value" });

	setTimeout(function() {
		request("http://127.0.0.1:12833/health", function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (!data) {
				fail("Expected health check endpoint to respond with a JSON.");
			}

			if (data.success !== false) {
				fail("Expected health check endpoint to respond with success: false");
			}

			if (data.error.indexOf("Health check not registered") < 0) {
				fail("Expected health check endpoint to respond with error: \"Health check not registered\"");
			}
			
			kardiaInstance.stopServer();

			next();
		});
	}, 100);
}