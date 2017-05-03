var M = require('asyncm');

exports.reduceF = reduceF;

exports.generatorToList = generatorToList;

exports.race = race;

function reduceF(array, f, firstF, defaultIfEmptyF) {
	if (!array.length) return defaultIfEmptyF();

	var acc = firstF(array[0]);

	for (let i = 1; i < array.length; i++) {
		acc = f(acc, array[i]);
	}

	return acc;
}

function generatorToList(generator) {
	return M.pureM(function() {
		var list = [];

		function processValue(genValue) {
			if (genValue) {
				list.push(genValue.value);

				if (genValue.next) {
					return genValue.next.next().result(processValue);
				} else {
					this.contResult(list);
				}
			} else {
				this.contResult(list);
			}
		}

		return generator.next().result(processValue);
	});
}

// Like M.parallel, but provides only result from first completed promise,
// ignores the rest (TODO: cancel the rest)
function race(ps) {
	return new M(function(result, error) {
		var finished = false;

		ps.forEach(function(m) {
			m.run(function() {
				if (finished) return;
				else finished = true;

				result.apply(null, arguments);
			}, function() {
				if (finished) return;
				else finished = true;

				error.apply(null, arguments);
			});
		});
	});
}
