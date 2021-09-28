/**
 * @fileoverview This file contains utility functions for assisting the application settings/configuration manager
 * with manipulating appropriate namespaces.  Namespaces are prefixes applied to settings keys to keep them organized
 * and make them available to either an individual app or common to all apps.
 */
goog.declareModuleId('os.config.namespace');

import * as osObject from '../object/object.js';
import * as osConfig from './config.js';

const googArray = goog.require('goog.array');
const googObject = goog.require('goog.object');


/**
 * Mapping of settings keys to migrate to os. {Array.<string>}
 */
export const CORE_KEYS = [
  'consent',
  'areas',
  'filters',
  'favorite',
  'locationFormat',
  'mute',
  'storage.writeType',
  'storage.introLastSeen',
  'userSounds',
  'theme',
  'accessible_theme'
];

/**
 * Obsolete keys that have actually been encountered somewhere in settings.  This list is populated as settings are
 * loaded and is cleared by the settings manager once the keys have been deleted.
 * E.G.: 'app.storage.writeType'
 * @type {!Array<!string>}
 */
export const keysToDelete = [];

/**
 * Keys that should be removed from storage if they're ever encountered.  This could be because they're no longer used
 * or because they've moved to the os namespace.
 * @type {?Array.<string>}
 */
let obsoleteKeys_ = null;

/**
 * Retrieve obsolete keys. This is provided as a function rather than a constant because the specific
 * application namespace will not be resolved yet.
 *
 * @return {!Array.<!string>}
 */
export const getObsoleteKeys = function() {
  if (!obsoleteKeys_) {
    obsoleteKeys_ = [
      // This is left here as an example
      // osConfig.appNs + '.' + 'bgColor'
      // osConfig.coreNs + '.' + 'bgColor'
    ];
  }
  return obsoleteKeys_;
};

/**
 * Clear obsolete keys
 */
export const clearObsoleteKeys = function() {
  getObsoleteKeys().length = 0;
};

/**
 * Delete keys which are designated as obsolete from the provided object.  Removes the key from the provided
 * object and marks it for deletion against the service by adding it to {@see osConfig.namespace.keysToDelete}.
 * Once the service has evaluated the keys to delete, it should clear that array.
 *
 * @param {Object} obj
 * @return {Object}
 */
export const removeObsoleteKeys = function(obj) {
  if (obj) {
    var keys = getObsoleteKeys();
    var reduced = /** @type {!Object.<string, *>} */ (osObject.reduce(obj));
    keys.forEach(function(key) {
      if (googObject.containsKey(reduced, key)) {
        delete reduced[key];
        googArray.insert(keysToDelete, key);
      }
    });
    return osObject.expand(reduced);
  } else {
    return null;
  }
};

/**
 * Migrate old settings structure, where each config object was unique to an application, and migrate it
 * to the new structure, where keys are namespaced appropriately to reflect os and application specific settings.
 *
 * @param {Object.<string, *>} config
 * @return {Object.<string, *>}
 */
export const addNamespaces = function(config) {
  var reduced = osObject.reduce(config);

  var namespaced = {};
  googObject.forEach(reduced, function(value, key) {
    namespaced[getPrefixedKey(key)] = value;
  });
  var expanded = osObject.expand(namespaced);

  return expanded;
};

/**
 * Remove the namespacing from configuration
 *
 * @param {Object.<string, *>} config
 * @return {Object.<string, *>}
 */
export const removeNamespaces = function(config) {
  var reduced = osObject.reduce(config);

  var startsWithNsRegex = new RegExp('^(' + osConfig.coreNs + '|' + osConfig.appNs + ')\\.');
  var namespaced = {};
  googObject.forEach(reduced, function(value, key) {
    namespaced[key.replace(startsWithNsRegex, '')] = value;
  });

  var expanded = osObject.expand(namespaced);
  return expanded;
};

/**
 * Returns the given key prefixed with the appropriate namespace for migration, whether it be the app or os
 *
 * @param {string} key
 * @return {string}
 */
export const getPrefixedKey = function(key) {
  return [isCoreKey(key) ? osConfig.coreNs : osConfig.appNs, key].join('.');
};

/**
 * Returns the given key prefixed with the appropriate namespace for migration, whether it be the app or os
 *
 * @param {Array.<string|number>} keys
 * @return {!Array.<string>}
 */
export const getPrefixedKeys = function(keys) {
  var namespaced;
  if (keys && keys.length > 0) {
    var reduced = keys.join('.');
    var prefix = isCoreKey(/** @type {!string} */ (reduced)) ? osConfig.coreNs : osConfig.appNs;
    namespaced = googArray.clone(keys);
    namespaced.unshift(prefix);
  }
  return namespaced || [];
};

/**
 * Determine if the given key should be migrated to os namespace
 *
 * @param {!string} key
 * @return {boolean}
 */
export const isCoreKey = function(key) {
  return CORE_KEYS.some((ck) => ck && ck.startsWith(key));
};
