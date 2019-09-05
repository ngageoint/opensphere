goog.provide('os.im.action.default');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('os.events.EventType');
goog.require('os.filter.default');
goog.require('os.fn');
goog.require('os.im.action.FilterActionParser');
goog.require('os.net.Request');
goog.require('os.ui.im.action.FilterActionImporter');


/**
 * Logger.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.action.default.LOGGER_ = goog.log.getLogger('os.im.action.default');


/**
 * Base settings key for default import actions.
 * @type {string}
 * @const
 */
os.im.action.default.ICON = '<i class="fa ' + os.filter.default.FA_ICON + '" ' +
    'title="This is an application default action and cannot be modified"></i>';


/**
 * @define {string} Base path to default actions.
 */
goog.define('os.im.action.default.FILE_ROOT', os.ROOT);


/**
 * Base settings key for default import actions.
 * @type {string}
 * @const
 */
os.im.action.default.BASE_KEY = 'os.defaultAction.';


/**
 * Settings keys for default import actions.
 * @enum {string}
 */
os.im.action.default.SettingKey = {
  FILES: os.im.action.default.BASE_KEY + 'files',
  ENABLED: os.im.action.default.BASE_KEY + 'enabled'
};


/**
 * Get the enabled state of the entry and its children.
 * @param {os.im.action.FilterActionEntry} entry The entry.
 * @param {Object<string, boolean>=} opt_result Object to store the result.
 * @return {!Object<string, boolean>} Map of entry id's to the enabled state.
 */
os.im.action.default.getEnabledMap = function(entry, opt_result) {
  var result = opt_result || {};
  if (entry) {
    if (entry.isEnabled()) {
      result[entry.getId()] = true;
    }

    var children = entry.getChildren();
    if (children) {
      for (var i = 0; i < children.length; i++) {
        os.im.action.default.getEnabledMap(children[i], result);
      }
    }
  }

  return result;
};


/**
 * Get the full path to a default actions file.
 * @param {string} file The base file path.
 * @return {string} The full file path.
 */
os.im.action.default.getFilePath = function(file) {
  if (file) {
    // ensure the root has a trailing slash (os.ROOT has one, module define does not)
    return os.im.action.default.FILE_ROOT +
        (os.im.action.default.FILE_ROOT.endsWith('/') ? '' : '/') +
        file;
  }

  return '';
};


/**
 * Load default import actions for a layer.
 * @param {string} layerId The layer id.
 * @param {Array<string>} files The files to load.
 * @return {!goog.Promise} A promise that resolves when default import actions have been loaded.
 */
os.im.action.default.load = function(layerId, files) {
  var filePromises = files.map(os.im.action.default.getFilePath)
      .map(function(file) {
        if (file) {
          var req = new os.net.Request(file);
          return req.getPromise().then(function(response) {
            return new goog.Promise(function(resolve, reject) {
              if (response) {
                var parser = new os.im.action.FilterActionParser();
                var importer = new os.ui.im.action.FilterActionImporter(parser, layerId, true);
                importer.listenOnce(os.events.EventType.COMPLETE, function() {
                  var matched = importer.matched;
                  importer.dispose();

                  resolve(os.ui.im.action.getEntriesFromMatched(matched));
                });
                importer.startImport(response);
                return;
              }

              // log the empty response, but resolve and carry on
              goog.log.warning(os.im.action.default.LOGGER_,
                  'Failed loading actions from "' + file + '": empty response');
              resolve([]);
            });
          }, function() {
            goog.log.warning(os.im.action.default.LOGGER_, 'Failed loading actions from "' + file + '": not found');
          });
        }
        return undefined;
      }).filter(os.fn.filterFalsey);

  return goog.Promise.all(filePromises).then(function(entries) {
    // flatten the arrays and remove null/undefined entries
    entries = [].concat.apply([], entries).filter(os.fn.filterFalsey);
    entries.forEach(os.im.action.default.initDefault_);
    return entries;
  });
};


/**
 * Initialize a default import action.
 * @param {os.im.action.FilterActionEntry} entry The entry.
 * @private
 */
os.im.action.default.initDefault_ = function(entry) {
  if (entry) {
    // mark as a default entry
    entry.setDefault(true);

    // init the enabled state from settings, defaulting to false
    var defaultEnabled = /** @type {!Object<string, boolean>} */ (
      os.settings.get(os.im.action.default.SettingKey.ENABLED, {}));
    entry.setEnabled(!!defaultEnabled[entry.getId()]);

    // init children
    var children = entry.getChildren();
    if (children) {
      children.forEach(os.im.action.default.initDefault_);
    }
  }
};
