goog.provide('os.im.mapping.MappingManager');

goog.require('goog.debug');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.im.mapping');
goog.require('os.im.mapping.IMapping');
goog.require('os.im.mapping.MappingRegistry');



/**
 * Manager for data mappings.
 * @constructor
 * @template T
 */
os.im.mapping.MappingManager = function() {
  /**
   * @type {Object<string, os.im.mapping.IMapping<T>>}
   * @private
   */
  this.mappings_ = {};

  /**
   * @type {os.im.mapping.MappingRegistry}
   * @private
   */
  this.registry_ = os.im.mapping.MappingRegistry.getInstance();
};
goog.addSingletonGetter(os.im.mapping.MappingManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.mapping.MappingManager.LOGGER_ = goog.log.getLogger('os.im.mapping.MappingManager');


/**
 * Gets all registered mappings.
 * @return {Object<string, os.im.mapping.IMapping<T>>}
 */
os.im.mapping.MappingManager.prototype.getMappings = function() {
  return this.mappings_;
};


/**
 * Get a mapping by id.
 * @param {string} id
 * @return {?os.im.mapping.IMapping<T>}
 */
os.im.mapping.MappingManager.prototype.getMapping = function(id) {
  return this.mappings_[id] || null;
};


/**
 * @param {os.im.mapping.IMapping<T>} mapping
 */
os.im.mapping.MappingManager.prototype.registerMapping = function(mapping) {
  var id = mapping.getId();
  if (id) {
    this.mappings_[id] = mapping;
  } else {
    goog.log.error(os.im.mapping.MappingManager.LOGGER_,
        'Unable to register mapping without an identifier! Mapping label is "' + mapping.getLabel() + '".');
  }
};


/**
 * Tries to determine which mappings apply to the provided set of items.
 * @param {Array<T>} items
 * @return {!Array<os.im.mapping.IMapping<T>>}
 */
os.im.mapping.MappingManager.prototype.autoDetect = function(items) {
  var matches = [];

  for (var key in this.mappings_) {
    var mapping = this.mappings_[key];
    var m = mapping.autoDetect(items);
    if (m) {
      matches.push(m);
    }
  }

  return this.retainHighestScoreMappings(matches);
};


/**
 * Compares mappings and only returns the highest scored within each score type.
 * @param {Array<os.im.mapping.IMapping<T>>} mappings
 * @return {!Array<os.im.mapping.IMapping<T>>}
 * @protected
 */
os.im.mapping.MappingManager.prototype.retainHighestScoreMappings = function(mappings) {
  var result = [];
  if (mappings) {
    // bucket by type in case we ever need to apply different reduce functions by mapping type
    var types = goog.array.bucket(mappings, function(m) {
      return m.getScoreType() || os.im.mapping.DEFAULT_SCORETYPE;
    });

    for (var key in types) {
      if (key == os.im.mapping.DEFAULT_SCORETYPE) {
        result = result.concat(types[key]);
      } else {
        result = result.concat(os.im.mapping.reduceMappings(types[key]));
      }
    }
  }

  return result;
};


/**
 * Persists mappings as a JSON object
 * @param {Array<os.im.mapping.IMapping<T>>} mappings The mappings to persist
 * @return {Object<string, *>} Mappings persisted as an object
 */
os.im.mapping.MappingManager.prototype.persistMappings = function(mappings) {
  var result = {};

  for (var i = 0, n = mappings.length; i < n; i++) {
    result[i] = mappings[i].persist();
  }

  return result;
};


/**
 * Restores a mapping from a JSON object.
 * @param {Object<string, *>} json The persisted mapping to restore.
 * @return {os.im.mapping.IMapping<T>} The restored mapping.
 */
os.im.mapping.MappingManager.prototype.restoreMapping = function(json) {
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
        goog.log.error(os.im.mapping.MappingManager.LOGGER_, e.message, e);
      }
    } else {
      goog.log.error(os.im.mapping.MappingManager.LOGGER_,
          'Failed to restore mapping: no mapping registered with id "' + id + '".');
    }
  } else {
    goog.log.error(os.im.mapping.MappingManager.LOGGER_,
        'Failed to restore mapping: persisted mapping does not have an id:\n' + goog.debug.expose(json));
  }

  return mapping;
};


/**
 * Restores mappings from a JSON object.
 * @param {Object<string, Object<string, *>>} json The persisted mappings to restore.
 * @return {Array<os.im.mapping.IMapping<T>>} The restored mappings.
 */
os.im.mapping.MappingManager.prototype.restoreMappings = function(json) {
  var mappings = [];

  for (var key in json) {
    var mapping = this.restoreMapping(json[key]);
    if (mapping) {
      mappings.push(mapping);
    }
  }

  return mappings;
};


/**
 * Persist mappings to an XML Element.
 * @param {!Array<!os.im.mapping.IMapping<T>>} mappings The mappings to persist
 * @return {!Element} Mappings persisted as an XML Element
 */
os.im.mapping.MappingManager.prototype.toXml = function(mappings) {
  var mappingsElement = os.xml.createElement('mappings');
  for (var i = 0, n = mappings.length; i < n; i++) {
    try {
      var mapping = /** @type {!os.IXmlPersistable} */ (mappings[i]);
      mappingsElement.appendChild(mapping.toXml());
    } catch (e) {
      goog.log.error(os.im.mapping.MappingManager.LOGGER_,
          'Failed to restore mapping from xml:\n' + goog.debug.expose(mapping));
    }
  }

  return mappingsElement;
};


/**
 * Restore a mapping from an XML element.
 * @param {!Element} xml The XML element for a mapping.
 * @return {os.im.mapping.IMapping} A newly constructed class with the values restored from config.
 */
os.im.mapping.MappingManager.prototype.fromXml = function(xml) {
  var mapping = this.registry_.getMapping(xml.getAttribute('type'));

  if (mapping) {
    mapping.fromXml(xml);
    return mapping;
  } else {
    var err = 'There was no class associated with the configuration object.';
    goog.log.error(os.im.mapping.MappingManager.LOGGER_, err);
  }

  return null;
};
