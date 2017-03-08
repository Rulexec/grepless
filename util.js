var M = require('asyncm');

exports.reduceF = reduceF;
exports.generatorEmpty = generatorEmpty;
exports.generatorSingle = generatorSingle;

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


function generatorEmpty() {
	return new Generator(function() { return M.pure(null, null); });
}
function generatorSingle(x) {
	return new Generator(function() { return M.pure(null, new GeneratorValue(x, null)); });
}

function generatorToList(generator) {
	return M.pureM(function() {
		var list = [];

		function processValue(genValue) {
			if (genValue) {
				list.push(genValue.value);

				if (genValue.next) {
					return genValue.next.next().bind(processValue);
				} else {
					this.cont(null, list);
				}
			} else {
				this.cont(null, list);
			}
		}

		return generator.next().bind(processValue);
	});
}

// Like M.parallel, but provides only result from first completed promise,
// ignores the rest (TODO: cancel the rest)
function race(ps) {
  return new M(function(callback) {
    var finished = false;

    ps.forEach(function(m) {
      m.run(function() {
        if (finished) return;
        else finished = true;

        callback.apply(null, arguments);
      });
    });
  });
};
