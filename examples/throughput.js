var Kardia = require('..');
var kardia = Kardia.start({ name: "example-service", port: 12900 });

kardia.on('serverRequest', function() {
	kardia.throughput('status request');
});

console.log('Kardia started on port 12900, and a "status requests" throughput counter gets calculated based on how often the status page is requested.');