var fail = require(__dirname + "/../lib/fail.js"),
	request = require("request");

module.exports = function(next) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12809 });

	setTimeout(function() {
		request("http://127.0.0.1:12809", function(err, res, body) {
			if (err) throw err;
			var data = JSON.parse(body);

			if (!data || !data.pid || !data.service) {
				fail("Expected Kardia to respond with JSON data, including \"pid\", \"service\", instead got: "+body);
			}

			if (data.service != serviceName) {
				fail("Kardia responded with incorrect service name.");
			}

			if (data.pid != process.pid) {
				fail("Kardia responded with incorrect pid.");
			}

			kardiaInstance.stopServer();

			next();
		});
	}, 100);
}
