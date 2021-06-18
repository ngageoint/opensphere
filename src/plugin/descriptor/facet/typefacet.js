goog.module('plugin.descriptor.facet.Type');
goog.module.declareLegacyNamespace();

const googString = goog.require('goog.string');
const ValueFacet = goog.require('os.search.ValueFacet');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * @extends {ValueFacet<!IDataDescriptor>}
 */
class Type extends ValueFacet {
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

exports = Type;
