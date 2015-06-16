console.log('Worker process started');

var kardia = require('../..');

kardia.set('worker-started', true);

console.log('Worker process (examples/cluster/worker.js) just set "worker-started" value in Kardia to true');

console.log('____________');

console.log('Now open your web browser at http://localhost:12800 and check the results.');