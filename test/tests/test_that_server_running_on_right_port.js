var fail = require(__dirname + "/../lib/fail.js");

module.exports = function(next) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12813 });
	kardiaInstance.server.on("listening", function(){
		var connectionKey = this._connectionKey;
		if (!connectionKey.match(/:12813$/)) {
			console.log("fail1");
			fail("Kardia ignore option port");
		}
		kardiaInstance.stopServer();

		next();
	});
}
