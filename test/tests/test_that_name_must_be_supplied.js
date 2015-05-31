var fail = require(__dirname + "/../lib/fail.js");

module.exports = function(next) {
	var errStr = "Kardia cannot start - service name must be supplied";
	console.log("Expecting "+errStr);
	try {
		var Kardia = require("../..");
		Kardia.start({});
		return fail("Test failed - expected \""+errStr+"\" to be raised.");
	}
	catch (err) {
		if (err && err.toString().match(/service name must be supplied/i) === null) {
			return fail("Test failed - expected \""+errStr+"\" to be raised.");
		}
	}

	next();
}
