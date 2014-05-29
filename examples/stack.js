var Kardia = require('..');
var kardia = Kardia.start({ name: "example-service", port: 12900 });

// start a new stack that will be capped at 10 items (this is optional step)
kardia.startStack('notices', 10);

// each second, push something to that stack
setInterval(function() {
	kardia.stack('notices', 'Some notice');
}, 1000);

console.log('Kardia started on port 12900, and a string is pushed to the stack of "notices" each second. Open your browser at: http://localhost:12900/');