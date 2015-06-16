var fail = require(__dirname + "/../lib/fail.js");

module.exports = function(next) {
	var errStr = "Kardia cannot start - service name must be supplied";
	console.log("Expecting "+errStr);

	var serviceName = "singleton-test-"+Date.now()+"."+Math.round(Math.random()*1000);

	// first instance must be started
	var Kardia = require("../..");

	var kardiaOne = Kardia.start({ name: serviceName, port: 12399 });

	var kardiaTwo = require("../..");

	try {
		kardiaOne._someSharedValueForTestingPurposes = Date.now();
		if (kardiaOne._someSharedValueForTestingPurposes !== kardiaTwo._someSharedValueForTestingPurposes || kardiaOne.config.name !== serviceName || kardiaTwo.config.name !== serviceName) {
			return fail(new Error('Kardia is not required as a singleton'));
		}
	} catch (e) {
		return fail(e);
	}

	kardiaOne.stopServer();

	next();
}
