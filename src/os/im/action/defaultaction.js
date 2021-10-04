goog.declareModuleId('os.im.action.default');

import Settings from '../../config/settings.js';
import EventType from '../../events/eventtype.js';
import {FA_ICON} from '../../filter/defaultfilter.js';
import {filterFalsey} from '../../fn/fn.js';
import Request from '../../net/request.js';
import {ROOT} from '../../os.js';
import FilterActionImporter from '../../ui/im/action/filteractionimporter.js';
import {getEntriesFromMatched} from '../../ui/im/action/filteractionui.js';
import FilterActionParser from './filteractionparser.js';

const Promise = goog.require('goog.Promise');
const log = goog.require('goog.log');

const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Logger.
 * @type {log.Logger}
 */
const logger = log.getLogger('os.im.action.default');

/**
 * Base settings key for default import actions.
 * @type {string}
 */
export const ICON = '<i class="fa ' + FA_ICON + '" ' +
    'title="This is an application default action. Changes to this action will be lost on refresh."></i>';

/**
 * Base settings key for default import actions.
 * @type {string}
 */
export const BASE_KEY = 'os.defaultAction.';

/**
 * Settings keys for default import actions.
 * @enum {string}
 */
export const SettingKey = {
  FILES: BASE_KEY + 'files',
  ENABLED: BASE_KEY + 'enabled'
};

/**
 * Get the URL to load a default actions file.
 * @param {osx.ResourceConfig} resource The resource config.
 * @return {string} The URL.
 */
export const getFileUrl = function(resource) {
  var result = '';
  if (resource && resource.url) {
    if (resource.debugPath) {
      result += goog.DEBUG ? resource.debugPath : ROOT;
    }
    result += resource.url;
  }

  return result;
};

/**
 * Load default import actions for a layer.
 * @param {string} layerId The layer id.
 * @param {Array<osx.ResourceConfig>} files The files to load.
 * @return {!Promise} A promise that resolves when default import actions have been loaded.
 */
export const load = function(layerId, files) {
  var filePromises = files.map(getFileUrl)
      .map(function(url) {
        if (url) {
          var req = new Request(url);
          return req.getPromise().then(function(response) {
            return new Promise(function(resolve, reject) {
              if (response) {
                var parser = new FilterActionParser();
                var importer = new FilterActionImporter(parser, layerId, true);
                importer.setIgnoreColumns(true);
                importer.listenOnce(EventType.COMPLETE, function() {
                  var matched = importer.matched;
                  importer.dispose();

                  resolve(getEntriesFromMatched(matched));
                });
                importer.startImport(response);
                return;
              }

              // log the empty response, but resolve and carry on
              log.warning(logger, 'Failed loading actions from "' + url + '": empty response');
              resolve([]);
            });
          }, function() {
            log.warning(logger, 'Failed loading actions from "' + url + '": not found');
          });
        }
        return undefined;
      }).filter(filterFalsey);

  return Promise.all(filePromises).then(function(entries) {
    // flatten the arrays and remove null/undefined entries
    entries = [].concat.apply([], entries).filter(filterFalsey);
    entries.forEach(initDefault_);
    return entries;
  });
};

/**
 * Initialize a default import action.
 * @param {FilterActionEntry} entry The entry.
 */
const initDefault_ = function(entry) {
  if (entry) {
    // mark as a default entry
    entry.setDefault(true);

    // init the enabled state from settings, defaulting to false
    var defaultEnabled = {};
    var type = entry.getType();
    if (type) {
      defaultEnabled = /** @type {!Object<string, boolean>} */ (
        Settings.getInstance().get(SettingKey.ENABLED + '.' + type, {}));
    }
    entry.setEnabled(!!defaultEnabled[entry.getId()]);

    // init children
    var children = entry.getChildren();
    if (children) {
      children.forEach(initDefault_);
    }
  }
};
