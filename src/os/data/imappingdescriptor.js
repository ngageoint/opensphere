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
   * Returns if the layer supports mapping
   * @return {boolean}
   */
  supportsMapping() {}


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


  /**
   * Update the Descriptor for reload
   * @param {*} value
   */
  update(value) {}
}

/**
 * ID for the interface
 * @const {string}
 */
IMappingDescriptor.ID = 'os.data.IMappingDescriptor';

exports = IMappingDescriptor;
