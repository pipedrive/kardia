var fail = require(__dirname + "/../lib/fail.js");

module.exports = function(next) {
	var errStr = "Kardia cannot start - configuration not supplied";
	console.log("Expecting "+errStr);
	try {
		var Kardia = require("../..");
		Kardia.start();
		return fail("Test failed - expected \""+errStr+"\" to be raised.");
	}
	catch (err) {
		if (err && err.toString().match(/configuration not supplied/i) === null) {
			return fail("Test failed - expected \""+errStr+"\" to be raised.");
		}
	}

	next();
}
