var fail = require(__dirname + "/../lib/fail.js");

module.exports = function(next) {
	var Kardia = require("../..");
	var serviceName = "test-" + new Date().toISOString();
	var kardiaInstance = Kardia.start({ name: serviceName, port: 12814, host: '127.0.0.1' });
	kardiaInstance.server.on("listening", function(){
		var connectionKey = this._connectionKey;
		if (!connectionKey.match(/:127\.0\.0\.1:/)) {
			fail("Kardia ignore option host");
		}
		kardiaInstance.stopServer();

		next();
	});
}
