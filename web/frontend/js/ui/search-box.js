in_package('Grepless.Web.UI.SearchBox', function() {

this.provide(View);

function View(options) {
	let onSearch = options.onSearch;

	let el = instantiate_template('search-box-template');
	this.getElement = function() { return el; };

	let state = {type: View.STATE.NORMAL};

	let doSearchButton = el.querySelector('button.do-search-button'),
	    searchInput = el.querySelector('input.search-input'),
			regexpCheckbox = el.querySelector('input.regexp-checkbox'),
			loadingIndicatorEl = el.querySelector('.loading-indicator');

	doSearchButton.addEventListener('click', function() {
		let isRegexp = regexpCheckbox.checked,
		    queryText = searchInput.value;

		onSearch({isRegexp, queryText});
	});

	this.changeState = function(newState) {
		let go = {
			[View.STATE.NORMAL]: function() {
				doSearchButton.removeAttribute('disabled');
				loadingIndicatorEl.style.display = 'none';
			},
			[View.STATE.SEARCHING]: function() {
				doSearchButton.setAttribute('disabled', true);
				loadingIndicatorEl.style.display = 'inline';
			}
		}[newState.type];

		go();
	}
}
View.STATE = {
	NORMAL: "normal",
	SEARCHING: "searching"
};

});
