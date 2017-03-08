var M = require('asyncm');

module.exports = AsyncCoroutine;

function AsyncCoroutineValue(value, asyncCoroutine) {
	this.value = value;
	this.next = asyncCoroutine;
}
function AsyncCoroutine(run) {
  this.next = run;
	// When stream is over, continues stream with f(x):Stream,
	// where `x` is last stream value,
	// and with g():Stream (or f():Stream), if no last value
	this.continueWith = function(f, g) {
		return new AsyncCoroutine(function() {
			return run.apply(null, arguments).bind(function(corValue) {
				if (corValue) {
					if (corValue.next) {
						this.cont(null, new AsyncCoroutineValue(corValue.value, corValue.next.continueWith(f)));
					} else {
						return f(corValue.value).bind(gen => new AsyncCoroutineValue(corValue.value, gen));
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
	// Replaces every stream value `x` with f(x)
	this.mapValue = function(f) {
		return new AsyncCoroutine(function() {
			return run.apply(null, arguments).bind(function(corValue) {
				if (corValue) {
					this.cont(null, new AsyncCoroutineValue(f(corValue.value), corValue.next && corValue.next.mapValue(f)));
				} else {
					this.cont(null, null);
				}
			});
		});
	};
	// gen: AsyncCoroutine<null + {value: T, args: arguments}, (<args> + AsyncCoroutine)>
	this.transform = function(gen) {
		return new AsyncCoroutine(function() {
			return run.apply(null, arguments).bind(transforming.bind(null, gen, arguments));

			function transforming(gen, args, corValue) {
				if (corValue) {
					return gen.next({value: corValue.value, args: args}).bind(function(transformerCorValue) {
						if (transformerCorValue) {
							let coroutineOrArgs = transformerCorValue.value,
							    transformer = transformerCorValue.next;

							if (coroutineOrArgs instanceof AsyncCoroutine) {
								return coroutineOrArgs.continueWith(function() {
									if (transformer) {
										return M.pure(null, corValue.next.transform(transformer));
									} else {
										// end of stream
										return M.pure(null, null);
									}
								}).next();
							} else {
								let m = coroutineOrArgs.length ? corValue.next.apply(null, coroutineOrArgs) : corValue.next();

								return m.bind(transforming.bind(null, transformer, coroutineOrArgs));
							}
						} else {
							// cancellation of transforming
							this.cont(null, corValue);
						}
					});
				} else {
					return gen.next(null);
				}
			}
		});
	};
}
AsyncCoroutine.Value = AsyncCoroutineValue;

AsyncCoroutine.empty = function generatorEmpty() {
	return new AsyncCoroutine(function() { return M.pure(null, null); });
};
AsyncCoroutine.single = function generatorSingle(x) {
	return new AsyncCoroutine(function() { return M.pure(null, new AsyncCoroutineValue(x, null)); });
};

AsyncCoroutine.fromArray = function generatorFromArray(array) {
	return new AsyncCoroutine(generator.bind(null, 0));

	function generator(i) {
		return M.pure(null, i < array.length ? new AsyncCoroutineValue(array[i], new AsyncCoroutine(generator.bind(null, i + 1))) : null);
	}
};
