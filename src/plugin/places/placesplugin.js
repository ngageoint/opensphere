goog.provide('plugin.places.PlacesPlugin');

goog.require('goog.log');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.clear.ClearEntry');
goog.require('os.ui.clearManager');
goog.require('os.ui.file.method.ImportMethod');
goog.require('plugin.places');
goog.require('plugin.places.KMLPlacesImportUI');
goog.require('plugin.places.PlacesClear');
goog.require('plugin.places.PlacesManager');
goog.require('plugin.places.menu');



/**
 * Plugin that allows the user to manage saved features as a KML tree.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.places.PlacesPlugin = function() {
  plugin.places.PlacesPlugin.base(this, 'constructor');
  this.id = plugin.places.ID;
};
goog.inherits(plugin.places.PlacesPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.places.PlacesPlugin);


/**
 * Logger for plugin.places.PlacesPlugin
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.places.PlacesPlugin.LOGGER_ = goog.log.getLogger('plugin.places.PlacesPlugin');


/**
 * @inheritDoc
 */
plugin.places.PlacesPlugin.prototype.disposeInternal = function() {
  plugin.places.PlacesPlugin.base(this, 'disposeInternal');

  plugin.places.menu.layerDispose();
  plugin.places.menu.mapDispose();
  plugin.places.menu.spatialDispose();
};


/**
 * @inheritDoc
 */
plugin.places.PlacesPlugin.prototype.init = function() {
  try {
    // initialize the manager
    var manager = plugin.places.PlacesManager.getInstance();
    manager.initialize();

    // register places actions
    plugin.places.menu.layerSetup();
    plugin.places.menu.mapSetup();
    plugin.places.menu.spatialSetup();
  } catch (e) {
    goog.log.error(plugin.places.PlacesPlugin.LOGGER_, 'Failed initializing Places plugin:', e);
  }
  var pim = os.placesImportManager;
  var pfm = os.placesFileManager;

  if (pfm) {
    // register file import method
    pfm.registerFileMethod(new os.ui.file.method.ImportMethod(false));
  } else {
    goog.log.warning(plugin.places.PlacesPlugin.LOGGER_, 'App did not define os.placesFileManager');
  }

  if (pim) {
    // kml
    pim.registerImportUI(plugin.file.kml.mime.TYPE, new plugin.places.KMLPlacesImportUI());
    pim.registerImportUI(plugin.file.kml.mime.KMZ_TYPE, new plugin.places.KMLPlacesImportUI());
    pim.registerImportDetails('KML/KMZ', true);
  } else {
    goog.log.warning(plugin.places.PlacesPlugin.LOGGER_, 'App did not define os.placesImportManager');
  }
};
