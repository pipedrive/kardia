var Kardia = require('..');
var kardia = Kardia.start({ name: "example-service", port: 12900 });

setInterval(function() {
	kardia.increment('heartbeats', 1);
}, 1500);

console.log('Kardia started on port 12900, and a counter "heartbeats" is bumped every 1,5 second');