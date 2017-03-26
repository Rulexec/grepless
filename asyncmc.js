(function(M){

if (typeof module !== 'undefined') {
	module.exports = AsyncCoroutine;
} else {
	window.AsyncCoroutine = AsyncCoroutine;
}

function AsyncCoroutineValue(value, asyncCoroutine) {
	if (!(this instanceof AsyncCoroutineValue)) throw new Error();

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
						this.cont(null, new AsyncCoroutineValue(corValue.value, corValue.next.continueWith(f, g)));
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
	this.mapValue = function(f, state) {
		return new AsyncCoroutine(function() {
			return run.apply(null, arguments).bind(function(corValue) {
				if (corValue) {
					let r = f(corValue.value, state);

					let result, newState;

					if (r instanceof AsyncCoroutine.MapValue) {
						result = r.result;
						newState = r.newState;
					} else {
						result = r;
						newState = state;
					}

					this.cont(null, new AsyncCoroutineValue(result, corValue.next && corValue.next.mapValue(f, newState)));
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
					let m = gen.next({value: corValue.value, args: args});
					
					return m.bind(function(transformerCorValue) {
						if (transformerCorValue) {
							let coroutineOrArgs = transformerCorValue.value,
							    transformer = transformerCorValue.next;

							if (coroutineOrArgs instanceof AsyncCoroutine) {
								return coroutineOrArgs.continueWith(function() {
									if (transformer) {
										return M.pure(null, corValue.next && corValue.next.transform(transformer));
									} else {
										// end of stream
										return M.pure(null, null);
									}
								}).next();
							} else {
								let m = coroutineOrArgs && coroutineOrArgs.length ?
								          corValue.next.next.apply(null, coroutineOrArgs)
								        : corValue.next.next();

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
	// Removes values from stream if !filter(x)
	this.filterValues = function(filter) {
		var transformator = new AsyncCoroutine(function(maybeValue) {
			if (!maybeValue) return null;

			let value = maybeValue.value;

			if (filter(value)) {
				return M.pure(null, new AsyncCoroutineValue(AsyncCoroutine.single(value), transformator));
			} else {
				return M.pure(null, new AsyncCoroutineValue(null, transformator));
			}
		});

		return this.transform(transformator);
	};
	this.filterMapValues = function(filterMap) {
		var transformator = new AsyncCoroutine(function(maybeValue) {
			if (!maybeValue) return null;

			let value = maybeValue.value,
			    maybeMap = filterMap(value);

			if (maybeMap instanceof AsyncCoroutine.FilterMapValue) {
				return M.pure(null, new AsyncCoroutineValue(AsyncCoroutine.single(maybeMap.value), transformator));
			} else {
				return M.pure(null, new AsyncCoroutineValue(null, transformator));
			}
		});

		return this.transform(transformator);
	};
	// Replaces every value `x` with generator from map(x): Async<Stream>
	this.mapValuesM = function(map) {
		var transformator = new AsyncCoroutine(function(maybeValue) {
			if (!maybeValue) return null;

			let value = maybeValue.value;

			return map(value).bind(function(stream) {
				return new AsyncCoroutineValue(stream, transformator);
			})
		});

		return this.transform(transformator);
	};
	// Returns Async<R>, reducer: (R, T) → R, initState: R
	this.reduceStream = function(reducer, initState) {
		function handleStream(state, cor) {
			if (!cor || !cor.next) return M.pure(null, state);

			let newState = reducer(state, cor.value);

			return cor.next.next().bind(handleStream.bind(null, newState));
		}

		return this.next().bind(handleStream.bind(null, initState));
	};
	// Returns Async<E, R>, reducer: (R, T) → Async<E, R>, initState: R
	this.reduceStreamM = function(reducer, initState) {
		function handleStream(state, cor) {
			if (!cor || !cor.next) return M.pure(null, state);

			let m = reducer(state, cor.value);

			if (m instanceof M) {
				return m.bind(continueWithNewState);
			} else {
				return continueWithNewState(m);
			}

			function continueWithNewState(newState) {
				return cor.next.next().bind(handleStream.bind(null, newState));
			}
		}

		return this.next().bind(handleStream.bind(null, initState));
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

AsyncCoroutine.MapValue = function(result, state) {
	this.result = result;
	this.state = state;
};
AsyncCoroutine.FilterMapValue = function(value) {
	this.value = value;
};

})(typeof M === 'undefined' ? require('asyncm') : M);
