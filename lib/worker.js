(function() {
	'use strict';
	var fluentd = require(__dirname + '/fluentd.js');

	function Worker(worker, config) {
		this.pid = worker.process.pid;
		this.id = worker.id;
		this.startTime = new Date();

		this.values = {};
		this.counters = {};
		this.stacks = {};
		this.stackConfig = {};
		this.throughputs = {};
		this.throughputsBuffer = {};

		this.startMemory = process.memoryUsage();
		this.fallBehind = 0;

		this.config = config;

		this.measureFallBehind();

		this.workerMessageListener = worker.on('message', (function workerMessageListenerHandler(msg) {
			if (!msg['~kardia']) {
				return;
			}

			if (msg['~kardia'].cmd && msg['~kardia'].args && this[msg['~kardia'].cmd]) {
				this[msg['~kardia'].cmd].apply(this, msg['~kardia'].args);
			}
		}).bind(this));

		return this;
	}

	Worker.prototype.set = function(name, value) {
		this.values[name] = value;
	};

	Worker.prototype.unset = function(name, value) {
		delete this.values[name];
	};

	Worker.prototype.increment = function(name, value) {
		this.counters[name] = (this.counters[name] || 0) + (Number(value) || 1);
	};

	Worker.prototype.decrement = function(name, value) {
		this.increment(name, -(Number(value) || 1));
	};

	Worker.prototype.throughput = function(name) {
		if (cluster.isWorker && process.send) {
			process.send({ '~kardia': { cmd: 'throughput', args: [].slice.call(arguments) } });
			return;
		}

		if (!this.throughputsBuffer[name]) {
			this.throughputsBuffer[name] = 0;
		}

		this.throughputsBuffer[name]++;

		// the throughput calculation interval time in seconds (will likely be configurable in the future):
		if (!this.throughputCalculationStep) {
			this.throughputCalculationStep = 30;
		}

		if (!this.throughputInterval && Object.keys(this.throughputsBuffer).length > 0) {

			// set up the appropriate interval to calculate throughput rates per sec, minute, hour
			this.throughputInterval = setInterval((function() {
				Object.keys(this.throughputsBuffer).forEach((function(key) {
					if (!this.throughputs[key]) {
						this.throughputs[key] = {};
					}
					if (!this.throughputs[key][this.throughputCalculationStep]) {
						this.throughputs[key][this.throughputCalculationStep] = {};
					}
					var x = this.throughputs[key][this.throughputCalculationStep];
					x.sec = parseInt((this.throughputsBuffer[key] / this.throughputCalculationStep).toFixed(2), 10);
					x.min = parseInt((this.throughputsBuffer[key] * (60 / this.throughputCalculationStep)).toFixed(2), 10);
					x.hour = parseInt((this.throughputsBuffer[key] * (3600 / this.throughputCalculationStep)).toFixed(2), 10);
					this.throughputsBuffer[key] = 0;

				}).bind(this));
				this.emit('throughputIntervalRun');
				
			}).bind(this), 1000 * this.throughputCalculationStep);
		}
	};

	Worker.prototype.clearThroughput = function(name) {
		if (cluster.isWorker && process.send) {
			process.send({ '~kardia': { cmd: 'clearThroughput', args: [].slice.call(arguments) } });
			return;
		}
		delete this.throughputsBuffer[name];
		delete this.throughput[name];

		if (Object.keys(this.throughputInterval).length === 0 && this.throughputInterval) {
			clearInterval(this.throughputInterval);
		}
	};

	Worker.prototype.startStack = function(name, size) {
		this.stacks[name] = [];
		this.stackConfig[name] = { size: Number(size) || 15 };
	};

	Worker.prototype.stack = function(name, value) {
		if (!this.stacks[name]) this.startStack(name);
		this.stacks[name].unshift({ time: new Date().toISOString(), value: value });
		this.stacks[name] = this.stacks[name].splice(0, this.stackConfig[name].size);
	};

	Worker.prototype.stopStack = function(name) {
		delete this.stacks[name];
		delete this.stackConfig[name];
	};

	Worker.prototype.generateStatus = function() {
		var date = new Date();
		return {
			pid: this.pid,
			startTime: this.startTime,
			uptime: Math.floor((date.getTime() - this.startTime.getTime())/1000),
			values: this.values,
			stacks: this.stacks,
			throughput: this.stacks,
			counters: this.counters,
			fallBehind: this.fallBehind
		};
	};

	Worker.prototype.measureFallBehind = function() {
		var that = this,
			time = process.hrtime();

		setTimeout(function() {
			var diff = process.hrtime(time);

			that.fallBehind = ((diff[0] - 1) * 1e9 + diff[1]) / 1e6;
			that.measureFallBehind();
		}, 1000).unref();
	};

	Worker.prototype.sendCounterToFluentd = function(name, value) {
		fluentd.incrementCounter(this.config, name, value);
	};

	module.exports = Worker;
})();