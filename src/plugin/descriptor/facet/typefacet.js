goog.module('plugin.descriptor.facet.Type');
goog.module.declareLegacyNamespace();

const ValueFacet = goog.require('os.search.ValueFacet');


/**
 * @extends {ValueFacet<!os.data.IDataDescriptor>}
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
    if (goog.string.endsWith(value, 's') && !goog.string.endsWith(value, 'es')) {
      return value.substring(0, value.length - 1);
    }

    return value;
  }
}

exports = Type;
