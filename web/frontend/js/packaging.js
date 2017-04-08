/* exported in_package */

function in_package(packagePath, fn) {
	if (typeof packagePath === 'string') {
		packagePath = packagePath.split('.');
	}

	let obj = packagePath.reduce(function(acc, x) {
		let o = acc[x];

		if (!o) {
			o = acc[x] = {};
		}

		return o;
	}, window);

	fn.call({
		provide: function(key, value) {
			if (arguments.length === 1) {
				value = key;
				key = value.name;
			}

			obj[key] = value;

			//
		}
	});
}
