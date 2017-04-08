var M = require('asyncm'),
    Immutable = require('immutable');

var fsM = require('./fsM.js'),
    path = require('path'),

		util = require('./util'),
		reduceF = util.reduceF,

		AsyncCoroutine = require('./asyncmc');

exports.walkDepthFirst = walkDepthFirst;

function walkDepthFirst(filepath) {
	return walkDepthFirstImpl(Immutable.Set(), filepath
	).bind(gen => gen.mapValue(({path: filepath}) => filepath));
}

// There must be prefix tree, not set of all visited paths
function walkDepthFirstImpl(initialIgnoreSet, filepath) { return M.pureM(function() {
	let absolutePath = path.resolve(filepath);

	if (initialIgnoreSet.has(absolutePath)) return M.pure(null, AsyncCoroutine.empty());

	let ignoreSet = initialIgnoreSet.add(absolutePath);

	return fsM.lstat(filepath).bind(function(stat) {
		if (stat.isFile()) {
			this.cont(null, AsyncCoroutine.single({ignoreSet, path: filepath}));
		} else if (stat.isDirectory()) {
			return processDir(filepath);
		} else if (stat.isSymbolicLink()) {
			return fsM.realpath(filepath).bind(function(resolvedPath) {
				return walkDepthFirstImpl(ignoreSet, resolvedPath);
			});
		} else {
			console.error('unknown file type, ignored', filepath, stat);
			this.cont(null, AsyncCoroutine.empty());
		}
	});

	function processDir(dirpath) {
		return fsM.readdir(dirpath).bind(function(filepaths) {
			return reduceF(filepaths, function(m, filepath) {
				return m.fmap(function(gen) {
					return gen.continueWith(continueWithLast, continueEmpty);

					function continueWithLast(lastValue) {
						return walkDepthFirstImpl(lastValue.ignoreSet, path.join(dirpath, filepath));
					}
					function continueEmpty() {
						return walkDepthFirstImpl(ignoreSet, path.join(dirpath, filepath));
					}
				});
			}, filepath => walkDepthFirstImpl(ignoreSet, path.join(dirpath, filepath)), () => M.pure(null, AsyncCoroutine.empty()));
		});
	}
}); }
