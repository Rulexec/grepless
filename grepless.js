var AsyncCoroutine = require('./asyncmc');

var walkDepthFirst = require('./walk-stream').walkDepthFirst,
    fileCloseableBinaryStream = require('./file-stream').fileCloseableBinaryStream,
		createLinesStream = require('./lines-stream').linesStream;

var util = require('./util'),
    generatorToList = util.generatorToList;

function Grepless(options) {
	if (!options) options = {};

	this._testPath = options.testPath || function() { return true; };

	// Returns AsyncStream<{filePath, lineNumber, line, spans: [{start, end (exclusive)}]}>
	this.search = function(testLine) {
		return new GreplessSearch({grepless: this, testLine});
	};
}

function GreplessSearch(options) {
	let testPath = options.grepless._testPath,
	    testLine = options.testLine;

	this.results = function() {
		return walkDepthFirst('.').bind(function(generator) {
			// all files of current directory
			return generator.filterValues(testPath).mapValuesM(function(filePath) {
				// filtered by testPath
				// open file
				return fileCloseableBinaryStream(filePath
				).fmap(function(file) {
					// transform to lines stream
					return createLinesStream(file.stream);
				}).fmap(function(linesStream) {
					return linesStream.mapValue(function(line, lineNumber) {
						// transform lines to objects with filePath, lineNumber
						return new AsyncCoroutine.MapValue(
							{filePath, lineNumber, line},
							lineNumber + 1
						);
					}, 1);
				});
			}).filterMapValues(function(lineDescriptor) {
				// filter lines
				let spans = testLine(lineDescriptor.line);

				if (spans) {
					// add `spans` field
					return new AsyncCoroutine.FilterMapValue(Object.assign({}, lineDescriptor, {spans}));
				} else {
					return null;
				}
			});
		});
	};
}

/*AsyncCoroutine.single('test').filterValues(x => true).mapValuesM(function() {
	return M.pure(null, AsyncCoroutine.single('passed'));
}).next().run(function(error, result) {
	console.log(error, result);
});*/

/*fileCloseableBinaryStream('.asyncmc.js.swp'
).fmap(function(file) {
	// transform to lines stream
	return createLinesStream(file.stream);
}).bind(generatorToList).run(function(error, result) {
	console.log(result[result.length - 1]);
});*/

let grepless = new Grepless();
grepless.search(x => {
	return x.indexOf('AsyncCoroutine') >= 0;
}).results().bind(generatorToList).run(function(error, result) {
	console.log(error, result);
});
