goog.provide('plugin.descriptor.facet.SearchTerm');

goog.require('os.search.SearchTermFacet');



/**
 * @constructor
 * @extends {os.search.SearchTermFacet<!os.data.IDataDescriptor>}
 */
plugin.descriptor.facet.SearchTerm = function() {
  plugin.descriptor.facet.SearchTerm.base(this, 'constructor');

  /**
   * @type {number}
   * @private
   */
  this.dateThreshold_ = -1;
};
goog.inherits(plugin.descriptor.facet.SearchTerm, os.search.SearchTermFacet);


/**
 * @type {number}
 * @private
 */
plugin.descriptor.facet.SearchTerm.DURATION_ = 2 * 7 * 24 * 60 * 60 * 1000;


/**
 * @inheritDoc
 */
plugin.descriptor.facet.SearchTerm.prototype.setTerm = function(term) {
  plugin.descriptor.facet.SearchTerm.base(this, 'setTerm', term);
  this.dateThreshold_ = -1;

  if (term) {
    var now = goog.now();
    this.dateThreshold_ = now - plugin.descriptor.facet.SearchTerm.DURATION_;
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.SearchTerm.prototype.testInternal = function(item) {
  var score = plugin.descriptor.facet.SearchTerm.base(this, 'testInternal', item);
  if (score) {
    // items that the user has recently activated should be higher in the list
    var lastActive = item.getLastActive();
    var duration = plugin.descriptor.facet.SearchTerm.DURATION_;

    if (!isNaN(lastActive)) {
      score += 5 * (Math.max(0, lastActive - this.dateThreshold_) / duration);
    }
  }

  return score;
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.SearchTerm.prototype.getTexts = function(item) {
  return [item.getSearchText(), item.getTitle()];
};
