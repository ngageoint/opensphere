goog.provide('os.ui.action.windows');
goog.provide('os.ui.action.windows.GroupType');

goog.require('goog.Timer');
goog.require('os.metrics.keys');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');


/**
 * @type {os.ui.action.ActionManager}
 */
os.ui.action.windows.manager = null;


/**
 * Default groups in the layer menu.
 * @enum {string}
 */
os.ui.action.windows.GroupType = {
  MAJOR: '0:',
  MINOR: '1:'
};


/**
 * @type {Object<string, Function|Object<string, string>>}
 * @private
 */
os.ui.action.windows.configs_ = {};


/**
 * @param {string} id The window id
 * @param {Object<string, string>} config The window config to pass to os.ui.window.create
 * @param {boolean=} opt_isMajor
 * @param {Function=} opt_func
 * @return {os.ui.action.Action}
 */
os.ui.action.windows.addWindow = function(id, config, opt_isMajor, opt_func) {
  config['id'] = id;

  os.ui.action.windows.configs_[id] = opt_func || config;

  var eventType = 'openWindow.' + id;
  var action = new os.ui.action.Action(
      eventType,
      config['label'],
      config['description'] || '',
      config['icon'],
      config['shortcut'],
      new os.ui.action.MenuOptions(null,
          opt_isMajor ? os.ui.action.windows.GroupType.MAJOR : os.ui.action.windows.GroupType.MINOR),
      config['metricKey']);

  // don't need this any more
  delete config['shortcut'];
  os.ui.action.windows.manager.addAction(action);
  os.ui.action.windows.manager.listen(eventType, os.ui.action.windows.openWindow);

  // see if this window should be open initially
  return action;
};


/**
 * Sets up layer actions
 */
os.ui.action.windows.setup = function() {
  if (!os.ui.action.windows.manager) {
    os.ui.action.windows.manager = new os.ui.action.ActionManager();
  }
};


/**
 * Disposes layer actions
 */
os.ui.action.windows.dispose = function() {
  if (os.ui.action.windows.manager) {
    os.ui.action.windows.manager.dispose();
    os.ui.action.windows.manager = null;
  }
};


/**
 * @param {string|os.ui.action.ActionEvent} evt
 * @return {boolean} whether it was successful
 */
os.ui.action.windows.openWindow = function(evt) {
  var id = goog.isString(evt) ? evt : evt.type.split(/\./)[1];

  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
    return true;
  } else {
    var config = os.ui.action.windows.configs_[id];

    if (config) {
      if (goog.isFunction(config)) {
        config();
      } else {
        config = goog.object.clone(config);
        var html = config['html'];
        delete config['html'];
        os.ui.window.create(config, html);
      }

      return true;
    }
  }

  return false;
};


/**
 * Opens settings with a specific plugin selected
 * @param {string} id
 */
os.ui.action.windows.openSettingsTo = function(id) {
  os.ui.config.SettingsManager.getInstance().setSelectedPlugin(id);
  os.ui.action.windows.openWindow('settings');
};
