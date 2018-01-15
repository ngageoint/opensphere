/**
 * @fileoverview This file contains utility functions for assisting the application settings/configuration manager
 * with manipulating appropriate namespaces.  Namespaces are prefixes applied to settings keys to keep them organized
 * and make them available to either an individual app or common to all apps.
 */
goog.provide('os.config.namespace');

goog.require('goog.array');
goog.require('goog.string');
goog.require('os.config');
goog.require('os.object');


/**
 * Mapping of settings keys to migrate to os.
 * @const {Array.<string>}
 */
os.config.namespace.CORE_KEYS = [
  'consent',
  'areas',
  'filters',
  'favorite',
  'locationFormat',
  'mute',
  'search.recent',
  'storage.writeType',
  'storage.introLastSeen',
  'userSounds'
];


/**
 * Obsolete keys that have actually been encountered somewhere in settings.  This list is populated as settings are
 * loaded and is cleared by the settings manager once the keys have been deleted.
 * E.G.: 'app.storage.writeType'
 * @type {!Array<!string>}
 */
os.config.namespace.keysToDelete = [];


/**
 * Keys that should be removed from storage if they're ever encountered.  This could be because they're no longer used
 * or because they've moved to the os namespace.
 * @type {?Array.<string>}
 * @private
 */
os.config.namespace.obsoleteKeys_ = null;


/**
 * Retrieve obsolete keys. This is provided as a function rather than a constant because the specific
 * application namespace will not be resolved yet.
 *
 * @return {!Array.<!string>}
 */
os.config.namespace.getObsoleteKeys = function() {
  if (!os.config.namespace.obsoleteKeys_) {
    os.config.namespace.obsoleteKeys_ = [
      // This is left here as an example
      // os.config.appNs + '.' + 'bgColor'
      // os.config.coreNs + '.' + 'bgColor'
    ];
  }
  return os.config.namespace.obsoleteKeys_;
};


/**
 * Clear obsolete keys
 */
os.config.namespace.clearObsoleteKeys = function() {
  goog.array.clear(os.config.namespace.getObsoleteKeys());
};


/**
 * Delete keys which are designated as obsolete from the provided object.  Removes the key from the provided
 * object and marks it for deletion against the service by adding it to {@see os.config.namespace.keysToDelete}.
 * Once the service has evaluated the keys to delete, it should clear that array.
 *
 * @param {Object} obj
 * @return {Object}
 */
os.config.namespace.removeObsoleteKeys = function(obj) {
  if (obj) {
    var keys = os.config.namespace.getObsoleteKeys();
    var reduced = /** @type {!Object.<string, *>} */ (os.object.reduce(obj));
    goog.array.forEach(keys, function(key) {
      if (goog.object.containsKey(reduced, key)) {
        delete reduced[key];
        goog.array.insert(os.config.namespace.keysToDelete, key);
      }
    });
    return os.object.expand(reduced);
  } else {
    return null;
  }
};


/**
 * Migrate old settings structure, where each config object was unique to an application, and migrate it
 * to the new structure, where keys are namespaced appropriately to reflect os and application specific settings.
 * @param {Object.<string, *>} config
 * @return {Object.<string, *>}
 */
os.config.namespace.addNamespaces = function(config) {
  var reduced = os.object.reduce(config);

  var namespaced = {};
  goog.object.forEach(reduced, function(value, key) {
    namespaced[os.config.namespace.getPrefixedKey(key)] = value;
  });
  var expanded = os.object.expand(namespaced);

  return expanded;
};


/**
 * Remove the namespacing from configuration
 * @param {Object.<string, *>} config
 * @return {Object.<string, *>}
 */
os.config.namespace.removeNamespaces = function(config) {
  var reduced = os.object.reduce(config);

  var startsWithNsRegex = new RegExp('^(' + os.config.coreNs + '|' + os.config.appNs + ')\\.');
  var namespaced = {};
  goog.object.forEach(reduced, function(value, key) {
    namespaced[key.replace(startsWithNsRegex, '')] = value;
  });

  var expanded = os.object.expand(namespaced);
  return expanded;
};


/**
 * Returns the given key prefixed with the appropriate namespace for migration, whether it be the app or os
 * @param {string} key
 * @return {string}
 */
os.config.namespace.getPrefixedKey = function(key) {
  return [os.config.namespace.isCoreKey(key) ? os.config.coreNs : os.config.appNs, key].join('.');
};


/**
 * Returns the given key prefixed with the appropriate namespace for migration, whether it be the app or os
 * @param {Array.<string|number>} keys
 * @return {!Array.<string>}
 */
os.config.namespace.getPrefixedKeys = function(keys) {
  var namespaced;
  if (keys && keys.length > 0) {
    var reduced = keys.join('.');
    var prefix = os.config.namespace.isCoreKey(
        /** @type {!string} */ (reduced)) ? os.config.coreNs : os.config.appNs;
    namespaced = goog.array.clone(keys);
    namespaced.unshift(prefix);
  }
  return namespaced || [];
};


/**
 * Determine if the given key should be migrated to os namespace
 * @param {!string} key
 * @return {boolean}
 */
os.config.namespace.isCoreKey = function(key) {
  return goog.array.some(os.config.namespace.CORE_KEYS, function(ck) {
    return goog.string.startsWith(key, ck);
  });
};
