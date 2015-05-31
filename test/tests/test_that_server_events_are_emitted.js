var fail = require(__dirname + "/../lib/fail.js"),
	request = require("request");

module.exports = function(next) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12818 });

	setTimeout(function() {

		var expectTimeout = setTimeout(fail, 1000);

		kardiaInstance.on('serverRequest', function() {
			clearTimeout(expectTimeout);
			kardiaInstance.stopServer();
			next();
		});

		request("http://127.0.0.1:12818", function(err, res, body) {
			if (err) throw err;
			var data = JSON.parse(body);
		});
	}, 100);
}