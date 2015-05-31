"use strict";

var async = require("async"),
	fs = require("fs"),
	tests = fs.readdirSync(__dirname + "/tests"),
	testSequence = [];

var startTime = Date.now();

tests.forEach(function(test) {
	testSequence.push(function() {
		console.log("Runnning " + test + " ...");
		require(__dirname + "/tests/" + test).apply(this, arguments);
	});
});

testSequence.push(function() {
	console.log("\n========================================");
	console.log("OK! All tests passed. Took " + (Date.now() - startTime) + " ms");
	console.log("========================================\n");
	process.exit();
});

async.series(testSequence);