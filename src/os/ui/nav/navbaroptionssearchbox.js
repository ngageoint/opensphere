goog.module('os.ui.navbaroptions.searchbox');

const {directiveTag} = goog.require('os.ui.search.SearchBoxUI');


/**
 * Search box template.
 * @type {string}
 */
let searchBox = `<${directiveTag} show-clear="true"></${directiveTag}>`;

/**
 * @type {string}
 * @deprecated Please use getSearchBox and setSearchBox instead.
 */
const searchbox = searchBox;

/**
 * Get the search box UI.
 * @return {string}
 */
const getSearchBox = () => searchBox;

/**
 * Set the search box UI.
 * @param {string} value
 */
const setSearchBox = (value) => {
  searchBox = value;
};

exports = {
  searchbox,
  getSearchBox,
  setSearchBox
};
