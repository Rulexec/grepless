var M = require('asyncm');

exports.reduceF = reduceF;
exports.generatorEmpty = generatorEmpty;
exports.generatorSingle = generatorSingle;

exports.generatorToList = generatorToList;

function reduceF(array, f, firstF, defaultIfEmptyF) {
	if (!array.length) return defaultIfEmptyF();

	var acc = firstF(array[0]);

	for (let i = 1; i < array.length; i++) {
		acc = f(acc, array[i]);
	}

	return acc;
}

function GeneratorValue(value, generator) {
	this.value = value;
	this.next = generator;
}
function Generator(run) {
  this.next = run;
	this.continueWith = function(f, g) {
		return new Generator(function() {
			return run.apply(null, arguments).bind(function(genValue) {
				if (genValue) {
					if (genValue.next) {
						this.cont(null, new GeneratorValue(genValue.value, genValue.next.continueWith(f)));
					} else {
						return f(genValue.value).bind(gen => new GeneratorValue(genValue.value, gen));
					}
				} else {
					return (g || f)().bind(function(gen) {
						if (gen) return gen.next();
						else this.cont(null, null);
					});
				}
			});
		});
	};
	this.mapValue = function(f) {
		return new Generator(function() {
			return run.apply(null, arguments).bind(function(genValue) {
				if (genValue) {
					this.cont(null, new GeneratorValue(f(genValue.value), genValue.next && genValue.next.mapValue(f)));
				} else {
					this.cont(null, null);
				}
			});
		});
	};
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
