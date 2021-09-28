goog.module('os.ogc.registry');

const Registry = goog.require('os.data.Registry');

const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const {default: MenuItemOptions} = goog.requireType('os.ui.menu.MenuItemOptions');
const OGCService = goog.requireType('os.ogc.OGCService');
const Feature = goog.requireType('ol.Feature');


/**
 * Helper function which makes the "normal" MenuItem for an OGC FeatureLayer. The MenuItem opens a popup with
 * a select2 which calls the callback (returned by getCallback) if provided, OR adds the Area to the AreaManager
 * and pan/zooms to it
 *
 * @param {?Menu} menu a Menu into which to add/remove OGC FeatureLayer buttons
 * @param {!function()} sort a function that gets/increments a numeric index; as appropriate for the menu
 * @param {?function()} getCallback returns a function(feature); deals with timing of angular scope, etc
 * @param {!Array<*>} entry
 * @private
 */
const onAddUpdate_ = function(menu, sort, getCallback, entry) {
  if (menu) {
    const service = /** @type {!OGCService} */ (entry[1]);
    const settings = /** @type {!Object} */ (entry[2]);
    if (service && settings) {
      var eventType = service.getQuery().getEventType(); // this keeps the eventtype that was being used in prior implementation

      // must be configured in settings.json, have MenuItemOptions (i.e. settings), and not have already been added
      if (!menu.getRoot().find(eventType) && service.isConfigured()) {
        var root = menu.getRoot();
        root.addChild(Object.assign(
            {},
            settings,
            /** @type {MenuItemOptions} */ ({
              eventType: eventType,
              handler: function(service, getCallback, event) {
                var callback = null;
                if (getCallback) {
                  callback = getCallback();
                }
                service.getQuery().launch(callback);
              }.bind(undefined, service, getCallback),
              sort: sort()
            })
        ));
      }
    }
  }
};

/**
 * @param {?Menu} menu
 * @param {!Array<*>} entry
 * @private
 */
const onRemove_ = function(menu, entry) {
  if (menu) {
    const service = /** @type {!OGCService} */ (entry[1]);
    if (service) {
      var eventType = service.getQuery().getEventType(); // this keeps the eventtype that was being used in prior implementation
      var root = menu.getRoot();
      root.removeChild(eventType);
    }
  }
};

/**
 * @type {Registry<OGCService>}
 */
let instance;

/**
 * Helper function to add OGC FeatureLayer picker MenuItem(s) to a Menu; creates listeners which react to items being
 * added to the OCG Registry
 *
 * @param {Menu} menu
 * @param {number} sort
 * @param {function()=} opt_getCallback returns a function(feature, feature); deals with timing of angular scope, etc
 */
exports.addOGCMenuItems = function(menu, sort, opt_getCallback) {
  const registry = exports.getInstance();

  // use a pass-by reference shenanigans to maintain the order which items are added to the registry
  let start = sort;
  const next = function() {
    return start++;
  };

  // bind to when item is added or removed from the registry
  registry.on(
      onAddUpdate_.bind(undefined, menu, next, (opt_getCallback ? opt_getCallback : null)),
      onRemove_.bind(undefined, menu)
  );
};

/**
 * Get the singleton of this Registry
 * @return {Registry<OGCService>}
 */
exports.getInstance = function() {
  if (!instance) {
    instance = new Registry();
  }
  return instance;
};

/**
 * Get whether or not a service is enabled.
 * @param {string} key
 * @return {boolean} Whether or not picking by a the service's Features is enabled
 */
exports.isOGCServiceEnabled = function(key) {
  const service = /** @type {?OGCService} */ (exports.getInstance().get(key));
  return (!!service && service.isConfigured() === true);
};

/**
 * Launcher for the an OGC FeatureLayer picker (if registered).
 * @param {string} key
 * @param {Function=} opt_callback Optional callback function for the chosen feature.
 */
exports.launchOGCQueryPicker = function(key, opt_callback) {
  const service = /** @type {?OGCService} */ (exports.getInstance().get(key));
  if (service && service.isConfigured()) {
    const query = service.getQuery();
    if (query) {
      query.launch(/** @type {function(Feature)} */ (opt_callback));
    }
  }
};
