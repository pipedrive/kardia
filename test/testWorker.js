var cluster = require('cluster');

var Kardia = require('../');
var serviceName = 'test'+new Date().toISOString();
var kardia = Kardia.start({ name: serviceName, port: 12777 })

var fail = function(msg) {
	throw new Error(msg);
	process.exit(1);
}

kardia.stack('test', 1);
kardia.stack('test', 2);
kardia.stack('test', 3);
kardia.stack('test', 4);
kardia.stack('test', 5);
kardia.stack('test', 5);
kardia.stack('test', 7);
kardia.stack('test', 8);
kardia.stack('test', 8);
kardia.stack('test', 10);
kardia.stack('test', 11);
kardia.stack('test', 12);
kardia.stack('test', 13);
kardia.stack('test', 14);
kardia.stack('test', 15);
kardia.stack('test', 16);

kardia.increment('test');
kardia.increment('test');
kardia.decrement('test');

kardia.set('test', '123');

kardia.startStack('test2', 2);
kardia.stack('test2', 1);
kardia.stack('test2', 2);
kardia.stack('test2', 3);

if (cluster.isMaster) {
	cluster.fork();

	// @TODO: check the variables of the master process here upon worker exit
}

if (cluster.isWorker) {

	// var request = require("request");
	// request("http://127.0.0.1:12777", function(err, res, body) {
	// 	if (err) throw err;
	// 	var data = JSON.parse(body);

	// 	if (!data || !data.pid || !data.service) {
	// 		fail("Expected Kardia to respond with JSON data, including \"pid\", \"service\", instead got: "+body);
	// 	}

	// 	if (data.service != serviceName) {
	// 		fail("Kardia responded with incorrect service name.");
	// 	}

	// 	if (data.pid != process.pid) {
	// 		fail("Kardia responded with incorrect pid.");
	// 	}

	// 	@TODO: exit here

	// });
}