goog.declareModuleId('os.search.FeatureValueFacet');

import ValueFacet from './valuefacet.js';


/**
 * A facet based off a feature value.
 * @extends {ValueFacet<!ol.Feature>}
 */
export default class FeatureValueFacet extends ValueFacet {
  /**
   * Constructor.
   * @param {string} id The facet identifier.
   * @param {string} field The feature field.
   */
  constructor(id, field) {
    super(id);

    /**
     * The feature field.
     * @type {string}
     * @protected
     */
    this.field = field;
  }

  /**
   * @inheritDoc
   */
  getValue(item) {
    var value = item.get(this.field);
    return value != null ? String(value) : null;
  }
}
