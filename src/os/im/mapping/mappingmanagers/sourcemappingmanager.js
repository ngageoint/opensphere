goog.module('os.im.mapping.SourceMappingManager');
goog.module.declareLegacyNamespace();

const AbstractMappingManger = goog.requireType('os.im.mapping.AbstractMappingManager');


/**
 * Global SourceMappingManager instance.
 * @type {SourceMappingManager|undefined}
 */
let instance;

/**
 * A manager for all of the mappings that are applied to sources
 */
class SourceMappingManager {
  /**
   * Constructor
   */
  constructor() {
    /**
     * Object containing the Mapping Managers
     * {
     *  sourceId1: {
     *    managerKey: MappingManager
     *  },
     *  sourceId2: {
     *    managerKey: MappingManager
     *    managerKey2: Mappingmanager2
     *  },
     * }
     * @type {Object<string, Object>}
     * @private
     */
    this.MappingManagers_ = {};
  }

  /**
   * Returns all mapping managers
   * @return {Object}
   */
  getAllMappingManagers() {
    return this.MappingManagers_;
  }

  /**
   * Returns the mapping managers for a source
   * @param {string} sourceId
   * @return {Object<string, AbstractMappingManger>}
   */
  getSourceMappingManagers(sourceId) {
    return this.MappingManagers_[sourceId];
  }

  /**
   * Returns the mapping manager
   * @param {string} sourceId
   * @param {string} key
   * @return {?AbstractMappingManger}
   */
  getMappingManager(sourceId, key) {
    const mappings = this.MappingManagers_[sourceId] || {};

    return mappings[key] || undefined;
  }

  /**
   * Add a new Mapping Manager
   * @param {string} sourceId
   * @param {string} key
   * @param {AbstractMappingManger} manager
   * @return {boolean} returns true if sourceId is not already in use, false otherwise
   */
  addMappingManager(sourceId, key, manager) {
    const mappings = this.getSourceMappingManagers(sourceId) || {};

    if (!Object.keys(mappings).includes(key)) {
      this.MappingManagers_[sourceId] = {[`${key}`]: manager};
      return true;
    }
    return false;
  }

  /**
   * Deletes a Mapping Manager
   * @param {string} sourceId
   * @param {string} key
   */
  deleteMappingManager(sourceId, key) {
    const mappings = this.getSourceMappingManagers(sourceId) || {};

    if (Object.keys(mappings).includes(key)) {
      delete this.MappingManagers_[sourceId][key];
    }
  }

  /**
   * Get the global instance.
   * @return {!SourceMappingManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new SourceMappingManager();
    }

    return instance;
  }
}

exports = SourceMappingManager;
