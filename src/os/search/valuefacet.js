goog.provide('os.search.ValueFacet');
goog.require('os.search.BaseFacet');



/**
 * A facet based off an item value.
 * @param {string} id The facet identifier.
 * @abstract
 * @constructor
 * @extends {os.search.BaseFacet<T>}
 */
os.search.ValueFacet = function(id) {
  os.search.ValueFacet.base(this, 'constructor');

  /**
   * The facet identifier.
   * @type {string}
   * @protected
   */
  this.facetId = id;
};
goog.inherits(os.search.ValueFacet, os.search.BaseFacet);


/**
 * Gets the facet value for an item.
 *
 * @abstract
 * @param {T} item The search item.
 * @return {?string} The facet value.
 * @template T
 */
os.search.ValueFacet.prototype.getValue = function(item) {};


/**
 * @inheritDoc
 */
os.search.ValueFacet.prototype.load = function(item, facets) {
  var value = this.getValue(item);
  if (value != null) {
    os.search.BaseFacet.update(this.facetId, value, facets);
  }

  return undefined;
};


/**
 * @inheritDoc
 */
os.search.ValueFacet.prototype.test = function(item, facets, results) {
  var values = facets[this.facetId];

  if (values) {
    var value = this.getValue(item);
    var x = value != null ? values.indexOf(value) : -1;
    os.search.BaseFacet.updateResults(this.facetId, results, x > -1 ? 1 : 0);
  }

  return undefined;
};


/**
 * @inheritDoc
 */
os.search.ValueFacet.prototype.transformsValue = function(category) {
  return category === this.facetId;
};
