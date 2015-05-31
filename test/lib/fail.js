module.exports = function(msg) {
	throw new Error(msg);
	process.exit(1);
}