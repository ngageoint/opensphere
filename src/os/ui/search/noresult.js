goog.provide('os.ui.search.NoResult');
goog.require('os.search.AbstractSearchResult');



/**
 * Search results containing a coordinate to display on the map.
 * @extends {os.search.AbstractSearchResult<number>}
 * @constructor
 */
os.ui.search.NoResult = function() {
  os.ui.search.NoResult.base(this, 'constructor', 0, 0);
};
goog.inherits(os.ui.search.NoResult, os.search.AbstractSearchResult);


/**
 * @inheritDoc
 */
os.ui.search.NoResult.prototype.getSearchUI = function() {
  return '<div class="coord-result-card"><div class="result-card-header">No results found</div></div>';
};


/**
 * @inheritDoc
 */
os.ui.search.NoResult.prototype.setSearchUI = function(value) {
  // does nothing until the search UI is implemented as a directive
};
