/* exported instantiate_template */

function instantiate_template(id) {
	let el = document.getElementById(id);

	let clone = el.cloneNode(true /* deep */);

	clone.removeAttribute('id');

	return clone;
}
