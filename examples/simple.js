var Kardia = require('..');
var kardia = Kardia.start({ name: "example-service", port: 12900 });

// each 1,5 seconds, increment a counter 'heartbeats' by 1
setInterval(function() {
	kardia.increment('heartbeats', 1);
}, 1500);

console.log('Kardia started on port 12900, and a counter "heartbeats" is bumped every 1,5 second. Open your browser at: http://localhost:12900/');