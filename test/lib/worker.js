setTimeout(function() {
	var kardia = require('../..');
	var updater = setInterval(function() {
		try {
			kardia.set('worker999', true);
			clearInterval(updater);
		}
		catch (e) {
			// ignore.
		}
	});
}, 100);
