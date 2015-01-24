"use strict";

var http = require("http"),
	os = require("os"),
	cluster = require("cluster"),
	currentStatus = null;

exports.start = function(config) {
	if (currentStatus === null) {
		currentStatus = new Status(config);
		if (cluster.isMaster) {
			currentStatus.startServer();
		}
	}
	return currentStatus;
};

function Status(config){
	if (!config) {
		this.log("error", "Kardia cannot start - configuration not supplied");
		return false;
	}
	if (!config.name) {
		this.log("error", "Kardia cannot start - service name must be supplied");
		return false;
	}
	if (!config.port) {
		this.log("info", "Kardia starting on default port (12900)");
		config.port = 12900;
	}
	config.debug = !!config.debug;

	this.config = config;
	this.startTime = new Date();
	this.values = {};
	this.counters = {};
	this.stacks = {};
	this.workers = []; // @TODO
	this.startMemory = process.memoryUsage();
	this.fallBehind = 0;
	this.stackConfig = {};

	this.measureFallBehind();

	return this;
}

Status.prototype.measureFallBehind = function(){
	var that = this,
		time = process.hrtime();

	setTimeout(function(){
		var diff = process.hrtime(time);

		that.fallBehind = ((diff[0] - 1) * 1e9 + diff[1]) / 1e6;
		that.measureFallBehind();
	}, 1000);
}

Status.prototype.set = function(name, value){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'set', args: [].slice.call(arguments) } });
		return;
	}
	this.values[name] = value;
};

Status.prototype.unset = function(name, value){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'unset', args: [].slice.call(arguments) } });
		return;
	}
	delete this.values[name];
};

Status.prototype.increment = function(name, value){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'increment', args: [].slice.call(arguments) } });
		return;
	}
	this.counters[name] = (this.counters[name] || 0) + (Number(value) || 1);
};

Status.prototype.decrement = function(name, value){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'decrement', args: [].slice.call(arguments) } });
		return;
	}
	this.increment(name, -(Number(value) || 1));
};

Status.prototype.startStack = function(name, size){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'startStack', args: [].slice.call(arguments) } });
		return;
	}
	this.stacks[name] = [];
	this.stackConfig[name] = { size: Number(size) || 15 };
};

Status.prototype.stack = function(name, value){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'stack', args: [].slice.call(arguments) } });
		return;
	}
	if (!this.stacks[name]) this.startStack(name);
	this.stacks[name].unshift({ time: new Date().toISOString(), value: value });
	this.stacks[name] = this.stacks[name].splice(0, this.stackConfig[name].size);
};

Status.prototype.stopStack = function(name){
	if (cluster.isWorker && process.send) {
		process.send({ '~kardia': { cmd: 'stopStack', args: [].slice.call(arguments) } });
		return;
	}
	delete this.stacks[name];
	delete this.stackConfig[name];
};

Status.prototype.addWorker = function(worker){
	if (!worker || !worker.process || !worker.process.pid || !worker.id) {
		throw new Error("PID and ID are required to add a worker process to Kardia");
		return;
	}

	this.workers[worker.process.pid] = new Worker(worker, this);

	return this.workers[worker.process.pid];
}

Status.prototype.removeWorker = function(pid){
	if (!pid) {
		throw new Error("PID is required to remove a worker process from Kardia");
		return;
	}

	delete this.workers[pid];
}

Status.prototype.startServer = function(){
	cluster.on("fork", (function(worker) {
		this.addWorker(worker);
	}).bind(this));

	cluster.on("exit", (function(worker) {
		this.removeWorker(worker.process.pid);
	}).bind(this));

	this.server = http.createServer((function (req, res) {
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(this.generateStatus(req), false, 4) + "\n");
	}).bind(this));

	this.server.listen(this.config.port, (function(){
		this.log("info", "Kardia listening on port " + this.port);
	}).bind(this));

	this.server.on("error", (function(err){
		this.log("error", "Kardia error + " + err.stack);
	}).bind(this));
};

Status.prototype.stopServer = function(){
	if (!cluster.isMaster) {
		return false;
	}
	this.server.close();
	currentStatus = null;

	return true;
};

Status.prototype.generateStatus = function(req){
	var date = new Date();
	var resp = {
		service: this.config.name,
		pid: process.pid,
		env: process.env.NODE_ENV || "development",
		uptime: Math.floor((date.getTime() - this.startTime.getTime())/1000),
		uptime_formatted: formatTime(Math.floor((date.getTime() - this.startTime.getTime())/1000)),
		startTime: this.startTime.toISOString(),
		curTime: date.toISOString(),
		uid: process.getuid(),
		gid: process.getgid(),
		values: this.values,
		counters: this.counters,
		stacks: this.stacks,
		workers: handleWorkers(this.workers),
		remoteAddress: (req && req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : false),
		network: os.networkInterfaces(),
		hostname: os.hostname(),
		memory: formatMemory(process.memoryUsage(), this.startMemory),
		fallBehind: this.fallBehind,
		os: {
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem()
		},
		config: this.config
	};

	return resp;
};

Status.prototype.log = function(level, msg) {
	switch (level) {
		case "error":
			process.stderr.write(new Date().toString() + ": " + msg.toString() + "\n");
			throw new Error(msg.toString());
			break;
		default:
			if (this.config.debug) process.stdout.write(new Date().toString() + ": " + (msg ? msg.toString() : msg) + "\n");
			break;
	}
}

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

	this.workerMessageListener = worker.on("message", (function workerMessageListenerHandler(msg) {
		if (!msg["~kardia"]) {
			return;
		}

		if (msg["~kardia"].cmd && msg["~kardia"].args && this[msg["~kardia"].cmd]) {
			this[msg["~kardia"].cmd].apply(this, msg["~kardia"].args);
		}
	}).bind(this));

	return this;
}

Worker.prototype.set = function(name, value){
	this.values[name] = value;
};

Worker.prototype.unset = function(name, value){
	delete this.values[name];
};

Worker.prototype.increment = function(name, value){
	this.counters[name] = (this.counters[name] || 0) + (Number(value) || 1);
};

Worker.prototype.decrement = function(name, value){
	this.increment(name, -(Number(value) || 1));
};

Worker.prototype.startStack = function(name, size){
	this.stacks[name] = [];
	this.stackConfig[name] = { size: Number(size) || 15 };
};

Worker.prototype.stack = function(name, value){
	if (!this.stacks[name]) this.startStack(name);
	this.stacks[name].unshift({ time: new Date().toISOString(), value: value });
	this.stacks[name] = this.stacks[name].splice(0, this.stackConfig[name].size);
};

Worker.prototype.stopStack = function(name){
	delete this.stacks[name];
	delete this.stackConfig[name];
};

Worker.prototype.generateStatus = function(){
	var date = new Date();
	return {
		pid: this.pid,
		startTime: this.startTime,
		uptime: Math.floor((date.getTime() - this.startTime.getTime())/1000),
		values: this.values,
		stacks: this.stacks,
		counters: this.counters
	}
}

Worker.prototype.measureFallBehind = function(){
	var that = this,
		time = process.hrtime();

	setTimeout(function(){
		var diff = process.hrtime(time);

		that.fallBehind = ((diff[0] - 1) * 1e9 + diff[1]) / 1e6;
		that.measureFallBehind();
	}, 1000);
}

function formatMemory(current, initial){
	var response = {
		current: current,
		initial: initial,
		diff: {}
	};

	Object.keys(current).forEach(function(key){
		response.diff[key] = current[key] - initial[key];
	});

	return response;
}

function formatTime(seconds){
	var response = [];
	var weeks = Math.floor(seconds / (3600 * 24 * 7));
	seconds -= weeks * (3600 * 24 * 7);
	if(weeks){
		response.push(weeks + " week" + (weeks!=1 ? "s":""));
	}
	var days = Math.floor(seconds / (3600 * 24));
	seconds -= days * (3600 * 24);
	if(days){
		response.push(days + " day" + (days!=1 ? "s":""));
	}
	var hours = Math.floor(seconds / (3600));
	seconds -= hours * (3600);
	if(hours){
		response.push(hours + " hour" + (hours!=1 ? "s":""));
	}
	var minutes = Math.floor(seconds / (60));
	seconds -= minutes * (60);
	if(minutes){
		response.push(minutes + " minute" + (minutes!=1 ? "s":""));
	}

	response.push(seconds + " second" + (seconds!=1 ? "s":""));

	return response.join(", ");
}

function handleWorkers(workers){
	var response = [];
	Object.keys(workers).forEach(function(pid){
		response.push(workers[pid].generateStatus());
	});

	return response;
}
