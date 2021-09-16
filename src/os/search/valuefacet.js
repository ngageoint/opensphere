goog.module('os.search.ValueFacet');

const BaseFacet = goog.require('os.search.BaseFacet');


/**
 * A facet based off an item value.
 * @abstract
 */
class ValueFacet extends BaseFacet {
  /**
   * Constructor.
   * @param {string} id The facet identifier.
   */
  constructor(id) {
    super();

    /**
     * The facet identifier.
     * @type {string}
     * @protected
     */
    this.facetId = id;
  }

  /**
   * Gets the facet value for an item.
   *
   * @abstract
   * @param {T} item The search item.
   * @return {?string} The facet value.
   * @template T
   */
  getValue(item) {}

  /**
   * @inheritDoc
   */
  load(item, facets) {
    var value = this.getValue(item);
    if (value != null) {
      BaseFacet.update(this.facetId, value, facets);
    }

    return undefined;
  }

  /**
   * @inheritDoc
   */
  test(item, facets, results) {
    var values = facets[this.facetId];

    if (values) {
      var value = this.getValue(item);
      var x = value != null ? values.indexOf(value) : -1;
      BaseFacet.updateResults(this.facetId, results, x > -1 ? 1 : 0);
    }

    return undefined;
  }

  /**
   * @inheritDoc
   */
  transformsValue(category) {
    return category === this.facetId;
  }
}

exports = ValueFacet;
