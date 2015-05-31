"use strict";

var async = require("async"),
	fs = require("fs"),
	tests = fs.readdirSync(__dirname + "/tests"),
	testSequence = [];

var startTime = Date.now();

tests.forEach(function(test) {
	testSequence.push(require(__dirname + "/tests/" + test));
});

testSequence.push(function() {
	console.log("\n========================================");
	console.log("OK! All tests passed. Took " + (Date.now() - startTime) + " ms");
	console.log("========================================");
	process.exit();
});

async.series(testSequence);