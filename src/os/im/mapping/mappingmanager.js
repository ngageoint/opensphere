goog.declareModuleId('os.im.mapping.MappingManager');

import {bucket} from '../../array/array.js';
import {createElement} from '../../xml.js';
import {DEFAULT_SCORETYPE, reduceMappings} from './mapping.js';
import MappingRegistry from './mappingregistry.js';

const {expose} = goog.require('goog.debug');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: IXmlPersistable} = goog.requireType('os.IXmlPersistable');
const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


/**
 * Manager for data mappings.
 *
 * @template T
 */
export default class MappingManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Object<string, IMapping<T>>}
     * @private
     */
    this.mappings_ = {};

    /**
     * @type {MappingRegistry}
     * @private
     */
    this.registry_ = MappingRegistry.getInstance();
  }

  /**
   * Gets all registered mappings.
   *
   * @return {Object<string, IMapping<T>>}
   */
  getMappings() {
    return this.mappings_;
  }

  /**
   * Get a mapping by id.
   *
   * @param {string} id
   * @return {?IMapping<T>}
   */
  getMapping(id) {
    return this.mappings_[id] || null;
  }

  /**
   * @param {IMapping<T>} mapping
   */
  registerMapping(mapping) {
    var id = mapping.getId();
    if (id) {
      this.mappings_[id] = mapping;
    } else {
      log.error(logger,
          'Unable to register mapping without an identifier! Mapping label is "' + mapping.getLabel() + '".');
    }
  }

  /**
   * Tries to determine which mappings apply to the provided set of items.
   *
   * @param {Array<T>} items
   * @return {!Array<IMapping<T>>}
   */
  autoDetect(items) {
    var matches = [];

    for (var key in this.mappings_) {
      var mapping = this.mappings_[key];
      var m = mapping.autoDetect(items);
      if (m) {
        matches.push(m);
      }
    }

    return this.retainHighestScoreMappings(matches);
  }

  /**
   * Compares mappings and only returns the highest scored within each score type.
   *
   * @param {Array<IMapping<T>>} mappings
   * @return {!Array<IMapping<T>>}
   * @protected
   */
  retainHighestScoreMappings(mappings) {
    var result = [];
    if (mappings) {
      // bucket by type in case we ever need to apply different reduce functions by mapping type
      var types = bucket(mappings, function(m) {
        return m.getScoreType() || DEFAULT_SCORETYPE;
      });

      for (var key in types) {
        if (key == DEFAULT_SCORETYPE) {
          result = result.concat(types[key]);
        } else {
          result = result.concat(reduceMappings(types[key]));
        }
      }
    }

    return result;
  }

  /**
   * Persists mappings as a JSON object
   *
   * @param {Array<IMapping<T>>} mappings The mappings to persist
   * @return {Object<string, *>} Mappings persisted as an object
   */
  persistMappings(mappings) {
    var result = {};

    for (var i = 0, n = mappings.length; i < n; i++) {
      result[i] = mappings[i].persist();
    }

    return result;
  }

  /**
   * Restores a mapping from a JSON object.
   *
   * @param {Object<string, *>} json The persisted mapping to restore.
   * @return {IMapping<T>} The restored mapping.
   */
  restoreMapping(json) {
    var mapping = null;

    if ('id' in json) {
      var id = /** @type {string} */ (json['id']);
      var m = this.getMapping(id);
      if (m) {
        try {
          var clone = m.clone();
          clone.restore(json);
          mapping = clone;
        } catch (e) {
          log.error(logger, e.message, e);
        }
      } else {
        log.error(logger,
            'Failed to restore mapping: no mapping registered with id "' + id + '".');
      }
    } else {
      log.error(logger,
          'Failed to restore mapping: persisted mapping does not have an id:\n' + expose(json));
    }

    return mapping;
  }

  /**
   * Restores mappings from a JSON object.
   *
   * @param {Object<string, Object<string, *>>} json The persisted mappings to restore.
   * @return {Array<IMapping<T>>} The restored mappings.
   */
  restoreMappings(json) {
    var mappings = [];

    for (var key in json) {
      var mapping = this.restoreMapping(json[key]);
      if (mapping) {
        mappings.push(mapping);
      }
    }

    return mappings;
  }

  /**
   * Persist mappings to an XML Element.
   *
   * @param {!Array<!IMapping<T>>} mappings The mappings to persist
   * @return {!Element} Mappings persisted as an XML Element
   */
  toXml(mappings) {
    var mappingsElement = createElement('mappings');
    for (var i = 0, n = mappings.length; i < n; i++) {
      try {
        var mapping = /** @type {!IXmlPersistable} */ (mappings[i]);
        mappingsElement.appendChild(mapping.toXml());
      } catch (e) {
        log.error(logger,
            'Failed to restore mapping from xml:\n' + expose(mapping));
      }
    }

    return mappingsElement;
  }

  /**
   * Restore a mapping from an XML element.
   *
   * @param {!Element} xml The XML element for a mapping.
   * @return {IMapping} A newly constructed class with the values restored from config.
   */
  fromXml(xml) {
    var mapping = this.registry_.getMapping(xml.getAttribute('type'));

    if (mapping) {
      /** @type {!IXmlPersistable} */ (mapping).fromXml(xml);
      return mapping;
    } else {
      var err = 'There was no class associated with the configuration object.';
      log.error(logger, err);
    }

    return null;
  }

  /**
   * Get the global instance.
   * @return {!MappingManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new MappingManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {MappingManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {MappingManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.im.mapping.MappingManager');
