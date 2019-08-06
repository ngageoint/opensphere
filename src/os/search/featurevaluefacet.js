goog.provide('os.search.FeatureValueFacet');
goog.require('os.search.ValueFacet');



/**
 * A facet based off a feature value.
 * @param {string} id The facet identifier.
 * @param {string} field The feature field.
 * @constructor
 * @extends {os.search.ValueFacet<!ol.Feature>}
 */
os.search.FeatureValueFacet = function(id, field) {
  os.search.FeatureValueFacet.base(this, 'constructor', id);

  /**
   * The feature field.
   * @type {string}
   * @protected
   */
  this.field = field;
};
goog.inherits(os.search.FeatureValueFacet, os.search.ValueFacet);


/**
 * @inheritDoc
 */
os.search.FeatureValueFacet.prototype.getValue = function(item) {
  var value = item.get(this.field);
  return value != null ? String(value) : null;
};
