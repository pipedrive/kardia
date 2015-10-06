var fail = require(__dirname + '/lib/fail.js');

describe('Single instance', function() {
	it('Should be able to require Kardia as singleton', function(next) {
		var serviceName = 'singleton-test-'+Date.now()+'.'+Math.round(Math.random()*1000),
			Kardia = require('../'),
			kardiaOne = Kardia.start({ name: serviceName, port: 12399 }),
			kardiaTwo = require('../');

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
	});
});
