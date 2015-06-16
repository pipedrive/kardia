var Kardia = require('..');
var kardia = Kardia.start({ name: "example-service", port: 12900 });

// each 1,5 seconds, increment a counter 'heartbeats' by 1
setInterval(function() {
	kardia.increment('heartbeats', 1);
}, 1500);

// also set up a basic health check, that can be accessed via http://localhost:12900/check
kardia.registerHealthcheck({
	handler: function(callback) {
		if (parseInt(Date.now().toString().substr(-1), 10) > 6) {
			return callback(new Error("Health check randomly failing! Just for demo purposes. Try checking again!"));
		}
		callback();
	},
	timeout: 2
});

console.log('Kardia started on port 12900, and a counter "heartbeats" is bumped every 1,5 second. Open your browser at: http://localhost:12900/');