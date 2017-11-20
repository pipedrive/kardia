var fail = require(__dirname + '/lib/fail.js'),
	async = require('async'),
	http = require('http'),
	zlib = require('zlib'),
	sinon = require('sinon');

describe('Extra endpoints', function() {
	it('Should register extra endpoint that serves string', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 34531});

		clock.tick(100);

		kardiaInstance.registerEndpoint('/test', 'some output');

		http.get('http://127.0.0.1:34531/test', function(res) {
			var gunzip = zlib.createGunzip();
			var buffer = [];

			res.pipe(gunzip);

			gunzip.on('data', function(data) {
				buffer.push(data.toString())
			}).on('end', function() {
				buffer.join("").should.equal('some output');
				kardiaInstance.stopServer();
				return done();
			}).on('error', function(e) {
				kardiaInstance.stopServer();
				return done(e);
			})
		}).on('error', function(e) {
			kardiaInstance.stopServer();
			return done(e);
		});
	});

	it('Should register extra endpoint that serves function call', function(done) {
		var Kardia = require('../'),
			clock = sinon.useFakeTimers(),
			serviceName = 'test-' + new Date().toISOString(),
			kardiaInstance = Kardia.start({ name: serviceName, port: 34533}),
			fn = (123).toString();

		clock.tick(100);

		kardiaInstance.registerEndpoint('/test', fn);

		http.get('http://127.0.0.1:34533/test', function(res) {
			var gunzip = zlib.createGunzip();
			var buffer = [];

			res.pipe(gunzip);

			gunzip.on('data', function(data) {
				buffer.push(data.toString());
				kardiaInstance.stopServer();
			}).on('end', function() {
				buffer.join('').should.equal('123');
				kardiaInstance.stopServer();
				return done();
			}).on('error', function(e) {
				kardiaInstance.stopServer();
				return done(e);
			})
		}).on('error', function(e) {
			kardiaInstance.stopServer();
			return done(e);
		});
	});
});