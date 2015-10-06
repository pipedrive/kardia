var fail = require(__dirname + '/lib/fail.js');

describe('Configuration', function() {
	it('Should require configuration to be set', function(done) {
		var errStr = 'Kardia cannot start - configuration not supplied';
		
		try {
			var Kardia = require('../');
			Kardia.start();
			return fail('Test failed - expected "'+errStr+'" to be raised.');
		}
		catch (err) {
			if (err && err.toString().match(/configuration not supplied/i) === null) {
				return fail('Test failed - expected "'+errStr+'" to be raised.');
			}
		}

		done();
	});

	it('Should require service name', function(done) {
		var errStr = 'Kardia cannot start - service name must be supplied';

		try {
			var Kardia = require('../');
			Kardia.start({});
			return fail('Test failed - expected "'+errStr+'" to be raised.');
		}
		catch (err) {
			if (err && err.toString().match(/service name must be supplied/i) === null) {
				return fail('Test failed - expected "'+errStr+'" to be raised.');
			}
		}

		done();
	});
});