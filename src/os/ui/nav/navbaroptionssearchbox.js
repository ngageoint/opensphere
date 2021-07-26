goog.module('os.ui.navbaroptions.searchbox');
goog.module.declareLegacyNamespace();

const {directiveTag} = goog.require('os.ui.search.SearchBoxUI');


/**
 * Search box template.
 * @type {string}
 */
let searchBox = `<${directiveTag} show-clear="true"></${directiveTag}>`;

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
  getSearchBox,
  setSearchBox
};
