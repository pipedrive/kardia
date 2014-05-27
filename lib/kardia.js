"use strict";

var http = require("http"),
	os = require("os");

exports.start = function(config) {
	var currentStatus = new Status(config);
	currentStatus.startServer();
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
	this.workers = []; // @TODO
	this.startMemory = process.memoryUsage();
	this.fallBehind = 0;

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
	this.values[name] = value;
};

Status.prototype.unset = function(name, value){
	delete this.values[name];
};

Status.prototype.increment = function(name, value){
	this.counters[name] = (this.counters[name] || 0) + (Number(value) || 1);
};

Status.prototype.decrement = function(name, value){
	this.increment(name, -(Number(value) || 1));
};

Status.prototype.addWorker = function(worker){
	if (!worker || !worker.process || !worker.process.pid || !worker.id) {
		throw new Error("PID and ID are required to add a worker process to Kardia");
		return;
	}

	this.workers[worker.process.pid] = {
		id: worker.id,
		start: new Date()
	}
}

Status.prototype.removeWorker = function(pid){
	if (!pid) {
		throw new Error("PID is required to remove a worker process from Kardia");
		return;
	}

	delete this.workers[pid];
}

Status.prototype.startServer = function(){
	this.server = http.createServer((function (req, res) {
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(this.generate(req), false, 4) + "\n");
	}).bind(this));

	this.server.listen(this.config.port, (function(){
		this.log("info", "Kardia listening on port " + this.port);
	}).bind(this));

	this.server.on("error", (function(err){
		this.log("error", "Kardia error + " + err.stack);
	}).bind(this));
};

Status.prototype.stopServer = function(){
	return this.server.close();
};

Status.prototype.generate = function(req){
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
		workers: handleWorkers(this.workers),
		remoteAddress: req.socket.remoteAddress,
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
        var worker = {
            pid: pid
        };
        Object.keys(workers[pid]).forEach(function(key){
            var date;
            switch(key){
                case "start":
                    date = new Date();
                    worker.startTime = workers[pid][key].toISOString();
                    worker.curTime = date.toISOString();
                    worker.uptime = Math.floor((date.getTime() - workers[pid][key].getTime())/1000);
                    break;
                default:
                    worker[key] = workers[pid][key];
            }

        });

        response.push(worker);
    });

    return response;
}