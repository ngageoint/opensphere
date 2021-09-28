goog.declareModuleId('os.data.IMappingDescriptor');

const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * An interface for descriptors that support mappings
 * @interface
 */
export default class IMappingDescriptor {
  /**
   * Returns if the layer supports mapping
   * @return {boolean}
   */
  supportsMapping() {}


  /**
   * Get the column mappings to apply to imported data.
   *
   * @return {Array.<IMapping>}
   */
  getMappings() {}


  /**
   * Set the column mappings to apply to imported data.
   *
   * @param {Array.<IMapping>} value
   */
  setMappings(value) {}


  /**
   * Update the Descriptor mappings for reload
   * @param {ILayer=} layer
   */
  updateMappings(layer) {}
}

/**
 * ID for the interface
 * @const {string}
 */
IMappingDescriptor.ID = 'os.data.IMappingDescriptor';
