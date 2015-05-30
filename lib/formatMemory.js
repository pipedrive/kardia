module.exports = function(current, initial){
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