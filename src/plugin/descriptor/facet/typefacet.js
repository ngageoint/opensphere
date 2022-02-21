goog.declareModuleId('plugin.descriptor.facet.Type');

import ValueFacet from '../../../os/search/valuefacet.js';

const googString = goog.require('goog.string');

/**
 * @extends {ValueFacet<!IDataDescriptor>}
 */
export default class Type extends ValueFacet {
  /**
   * Constructor.
   */
  constructor() {
    super('Type');
  }

  /**
   * @inheritDoc
   */
  getValue(item) {
    return item ? item.getType() : null;
  }

  /**
   * @inheritDoc
   */
  valueToLabel(value) {
    if (googString.endsWith(value, 's') && !googString.endsWith(value, 'es')) {
      return value.substring(0, value.length - 1);
    }

    return value;
  }
}
