/* globals window:false, M:false */

(function(M){

var MUtil = {};

MUtil.parallelBuilder = function() {
	var jobs = [];

	return {
		add: function(job) {
			jobs.push(job);
		},
		run: function() {
			return M.parallel(jobs);
		}
	};
};

if (typeof module !== 'undefined') {
	module.exports = MUtil;
} else {
	window.MUtil = MUtil;
}

})(typeof M === 'undefined' ? require('asyncm') : M);
