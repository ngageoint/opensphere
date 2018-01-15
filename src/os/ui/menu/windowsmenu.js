goog.provide('os.ui.menu.windows');
goog.provide('os.ui.menu.windows.GroupType');

goog.require('goog.Timer');
goog.require('os.metrics.keys');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');


/**
 * The windows menu.
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.menu.windows.MENU = undefined;


/**
 * Default groups in the layer menu.
 * @enum {string}
 */
os.ui.menu.windows.GroupType = {
  MAJOR: '0:Major',
  MINOR: '1:Minor'
};


/**
 * @type {Object<string, Function|Object<string, string>>}
 * @private
 */
os.ui.menu.windows.configs_ = {};


/**
 * @param {string} id The window id
 * @param {Object<string, string>} config The window config to pass to os.ui.window.create
 * @param {boolean=} opt_isMajor
 * @param {Function=} opt_func
 * @return {os.ui.menu.MenuItem|undefined}
 */
os.ui.menu.windows.addWindow = function(id, config, opt_isMajor, opt_func) {
  if (!os.ui.menu.windows.MENU) {
    return;
  }

  config['id'] = id;
  os.ui.menu.windows.configs_[id] = opt_func || config;

  var menuItem;
  var eventType = 'openWindow.' + id;
  var groupType = opt_isMajor ? os.ui.menu.windows.GroupType.MAJOR : os.ui.menu.windows.GroupType.MINOR;
  var group = os.ui.menu.windows.MENU.getRoot().find(groupType);
  if (group) {
    menuItem = group.addChild({
      label: config['label'],
      eventType: eventType,
      tooltip: config['description'] || '',
      icons: ['<i class="fa fa-fw ' + config['icon'] + '"></i>'],
      shortcut: config['shortcut'],
      metricKey: config['metricKey'],
      handler: os.ui.menu.windows.openWindow
    });
  }

  // don't need this any more
  delete config['shortcut'];

  // see if this window should be open initially
  return menuItem;
};


/**
 * Set up the windows menu.
 */
os.ui.menu.windows.setup = function() {
  if (!os.ui.menu.windows.MENU) {
    os.ui.menu.windows.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        label: '',
        eventType: os.ui.menu.windows.GroupType.MAJOR,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 0
      }, {
        label: '',
        eventType: os.ui.menu.windows.GroupType.MINOR,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 1
      }]
    }));
  }
};


/**
 * Dispose the windows menu.
 */
os.ui.menu.windows.dispose = function() {
  goog.dispose(os.ui.menu.windows.MENU);
  os.ui.menu.windows.MENU = undefined;
};


/**
 * Open a window.
 * @param {string|os.ui.menu.MenuEvent} evt The menu event.
 * @return {boolean} If the open was successful.
 */
os.ui.menu.windows.openWindow = function(evt) {
  var id = goog.isString(evt) ? evt : evt.type.split(/\./)[1];

  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
    return true;
  } else {
    var config = os.ui.menu.windows.configs_[id];

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
os.ui.menu.windows.openSettingsTo = function(id) {
  os.ui.config.SettingsManager.getInstance().setSelectedPlugin(id);
  os.ui.menu.windows.openWindow('settings');
};
