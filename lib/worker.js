(function() {
	'use strict';

	function Worker(worker) {
		this.pid = worker.process.pid;
		this.id = worker.id;
		this.startTime = new Date();

		this.values = {};
		this.counters = {};
		this.stacks = {};
		this.stackConfig = {};

		this.startMemory = process.memoryUsage();
		this.fallBehind = 0;
		this.stackConfig = {};

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

	module.exports = Worker;
})();