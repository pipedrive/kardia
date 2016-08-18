(function() {
	'use strict';

	var currentStatus = null,
		cluster = require('cluster'),
		Status = require(__dirname + '/lib/status.js');

	// if running on a cluster worker, we assume the master already has Kardia started, thus we
	// instantiate a wrapper instance right-away
	if (!cluster.isMaster) {
		currentStatus = new Status({});
		module.exports = currentStatus;
	} else {
		var startHandler = function(config, callback) {
			if (currentStatus === null) {
				currentStatus = new Status(config);

				if (!currentStatus._instanceId) {
					currentStatus._instanceId = Date.now()+'.'+Math.round(Math.random()*1000);
				}

				currentStatus.on('serverStopped', function() {
					currentStatus = null;
					module.exports = { start: startHandler };
				});

				if (cluster.isMaster) {
					currentStatus.startServer();
				}

				module.exports = currentStatus;
			}

			if (callback && typeof callback === 'function') {
				callback();
			}

			return currentStatus;
		};

		// otherwise only expose the .start() command, which in turn returns the currentStatus.
		module.exports.start = startHandler;
	}
})();