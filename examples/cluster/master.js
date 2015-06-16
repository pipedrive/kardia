console.log('Master process started');

var Kardia = require('../..'),
	cluster = require('cluster'),
	kardia = Kardia.start({ name: "master-worker-cluster-example", port: 12800 });

kardia.set('master-started', true);

console.log('Master process (examples/cluster/master.js) just set "master-started" value in Kardia to true');

cluster.fork();