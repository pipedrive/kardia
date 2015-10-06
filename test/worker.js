var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	sinon = require('sinon'),
	spawn = require('child_process').spawn;

describe('Master-worker', function() {
	it('Should attach worker and send messages from worker to master', function(next) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12901 });

		clock.tick(100);

		var options = {
			cwd: __dirname + '/lib',
			env: process.env
		};

		var argv = [__dirname + '/lib/worker.js'];

		var worker = {
			id: 999,
			process: spawn('node', argv, options)
		};

		worker.on = worker.process.on;

		kardiaInstance.addWorker(worker);
		
		clock.tick(500);
		request('http://127.0.0.1:12901', function(err, res, body) {
			if (err) {
				throw err;
			}
			var data = JSON.parse(body);

			if (data.workers.length !== 1) {
				fail('Worker info not registered with Kardia');
			}

			if (data.workers[0].pid !== worker.process.pid) {
				fail('Worker PID incorrect or missing');
			}

			if (data.workers[0].startTime !== '1970-01-01T00:00:00.100Z') {
				fail('Worker startTime incorrect or missing');
			}

			kardiaInstance.stopServer();

			next();
		});
	});

	it('Should throw error on incorrect ID or PID', function(next) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 12901 });

		clock.tick(100);

		try {
			kardiaInstance.addWorker({});
		}
		catch (e) {
			if (!e.toString().match('PID and ID are required to add a worker process to Kardia')) {
				fail('Expected addWorker to throw an error');
			}
		}
		kardiaInstance.stopServer();
		next();

	});
});