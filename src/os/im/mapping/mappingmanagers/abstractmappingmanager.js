goog.module('os.im.mapping.AbstractMappingManager');
goog.module.declareLegacyNamespace();



/**
 * Class for mapping managers
 * @template T, S, U
 */
class AbstractMappingManager {
  /**
   * Constructor
   * @param {S} opt_source
   */
  constructor(opt_source) {
    /**
     * The listener added to the source
     * @type {*}
     * @protected
     */
    this.sourceListener_;

    /**
     * The source used
     * @type {S}
     * @protected
     */
    this.source_ = opt_source;

    /**
     * The mappings that were last applied to the data
     * @type {Array<T>}
     * @protected
     */
    this.appliedMappings_;

    /**
     * Mapping Options used for the ui
     * @type {?U}
     * @protected
     */
    this.mappingOptions_ = undefined;
  }

  /**
   * Create Mappings
   * @param {U} data
   * @return {Array<T>}
   */
  createMappings(data) {
    return this.getMappings();
  }

  /**
   * Returns the id of the source being mapped
   * @return {string}
   */
  getSourceId() {
    return this.source_.getId();
  }

  /**
   * Returns the mappings applied to the layer
   * @return {Array<T>}
   */
  getMappings() {
    return this.appliedMappings_;
  }

  /**
   * Returns the mappings applied to the layer
   * @param {Array<T>} value
   */
  setMappings(value) {
    this.appliedMappings_ = value;
  }

  /**
   * Gets the mapping options for later use
   * @return {?U}
   */
  getMappingOptions() {
    return this.mappingOptions_;
  }

  /**
   * Sets the mapping options for later use
   * @param {?U} value
   */
  setMappingOptions(value) {
    this.mappingOptions_ = value;
  }

  /**
   * Execute Mappings
   */
  executeMappings() {
    const mappings = this.getMappings() || [];
    const features = this.source_.getFeatures();

    mappings.forEach((mapping) => {
      features.forEach((feature) => {
        mapping.execute(feature);
      });
    });
  }

  /**
   * Dispose of the listener
   */
  dispose() {
    this.sourceListener_.dispose();
  }
}

exports = AbstractMappingManager;
