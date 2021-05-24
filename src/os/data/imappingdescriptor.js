goog.module('os.data.IMappingDescriptor');
goog.module.declareLegacyNamespace();


/**
 * The base interface for all object data we bring into our applications.
 * @interface
 */
class IMappingDescriptor {
  /**
   * Retrieve the ID
   * @return {?string}
   */
  getProvider() {}

  /**
   * Get the column mappings to apply to imported data.
   *
   * @return {Array.<os.im.mapping.IMapping>}
   */
  getMappings() {}


  /**
   * Set the column mappings to apply to imported data.
   *
   * @param {Array.<os.im.mapping.IMapping>} value
   */
  setMappings(value) {}
}

/**
 * ID for the interface
 * @const {string}
 */
IMappingDescriptor.ID = 'os.data.IMappingDescriptor';

exports = IMappingDescriptor;
