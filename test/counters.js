var	request = require('request');
var	sinon = require('sinon');
var	should = require('should');

describe('Counters', function() {
	var Kardia;
	var clock;
	var serviceName;
	var kardiaInstance;

	beforeEach(function() {
        Kardia = require('../');
		clock = sinon.useFakeTimers();
		serviceName = 'test-' + new Date().toISOString();
		kardiaInstance = Kardia.start({ name: serviceName, port: 12810 });
	});

	afterEach(function() {
        kardiaInstance.stopServer();
	});

	function getStatsAndAssert(assertFunction) {
        request('http://127.0.0.1:12810', function(err, res, body) {
            if (err) {
                throw err;
            }
            var data = JSON.parse(body);

            assertFunction(data);
        });
	}

	it('Should support modifying counters', function(done) {
		kardiaInstance.increment('test-counter', 1);
		kardiaInstance.increment('test-counter', 3);
		kardiaInstance.increment('test-counter', 0);
		kardiaInstance.decrement('test-counter', 1);

		clock.tick(1000);

		getStatsAndAssert(function(data) {
			should.exist(data.counters);
			should.exist(data.counters['test-counter']);
            data.counters['test-counter'].should.equal(4);

            done();
		});
	});

	it('Should support counter reset', function(done) {
        kardiaInstance.increment('test-counter', 1);
        kardiaInstance.increment('test-counter', 3);
        kardiaInstance.increment('test-counter-2', 1);
        kardiaInstance.reset('test-counter');

        clock.tick(1000);

        getStatsAndAssert(function(data) {
        	data.counters['test-counter'].should.equal(0);
        	data.counters['test-counter-2'].should.equal(1);

        	done();
		});
	});
});