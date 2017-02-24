var M = require('asyncm');

var fs = require('fs');

['readdir', 'lstat', 'realpath'].forEach(function(name) {
	exports[name] = wrapSingleFs(name);
});

function wrapSingleFs(name) {
	return function(arg) {
		return new M(function(callback) {
			fs[name].call(fs, arg, callback);
		});
	}
}
