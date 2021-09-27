goog.declareModuleId('os.ui.navbaroptions.searchbox');

import {directiveTag} from '../search/searchbox.js';


/**
 * Search box template.
 * @type {string}
 */
let searchBox = `<${directiveTag} show-clear="true"></${directiveTag}>`;

/**
 * @type {string}
 * @deprecated Please use getSearchBox and setSearchBox instead.
 */
export const searchbox = searchBox;

/**
 * Get the search box UI.
 * @return {string}
 */
export const getSearchBox = () => searchBox;

/**
 * Set the search box UI.
 * @param {string} value
 */
export const setSearchBox = (value) => {
  searchBox = value;
};
