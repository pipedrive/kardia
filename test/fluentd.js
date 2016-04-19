var fail = require(__dirname + '/lib/fail.js'),
	request = require('request'),
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	should = require('should-sinon'),
	counterName = 'sample-counter',
	config = {
		name: 'fluentd-mock-test',
		port: 9992,
		fluentd: {
			host: '127.0.0.1',
			port: 9991
		}
	};

describe('Fluentd integration', function() {
	it('Should send counters to fluentd', function() {
		var sendFunc = sinon.spy(),
			fluentd = proxyquire('../lib/fluentd', {
				dgram: {
					createSocket: function() {
						return {
							on: sinon.stub().returns(true),
							close: sinon.stub().returns(true),
							send: sendFunc
						};
					}
				}
			});

		fluentd.incrementCounter(config, counterName, 1);

		var stubObj = {};
		stubObj[config.name.replace(/\s/g, '-') + '.' + counterName + '.counter'] = 1;
		var stubBuffer = new Buffer(JSON.stringify(stubObj));

		sendFunc.getCall(0).args[0].toString().should.equal(stubBuffer.toString());
		sendFunc.getCall(0).args[1].should.equal(0);
		sendFunc.getCall(0).args[2].should.equal(stubBuffer.toString().length);
		sendFunc.getCall(0).args[5].should.be.instanceof(Function);
		sendFunc.should.be.calledOnce();

	});
});