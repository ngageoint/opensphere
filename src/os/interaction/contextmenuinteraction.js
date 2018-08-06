goog.provide('os.interaction.ContextMenu');

goog.require('os.I3DSupport');
goog.require('os.implements');
goog.require('os.ui.ol.interaction.ContextMenu');



/**
 * Context menu interactions for map clicks.
 * @param {os.ui.ol.interaction.ContextMenuOptions=} opt_options Options.
 * @implements {os.I3DSupport}
 * @extends {os.ui.ol.interaction.ContextMenu}
 * @constructor
 */
os.interaction.ContextMenu = function(opt_options) {
  os.interaction.ContextMenu.base(this, 'constructor', opt_options);

  // Protractor's mouseDown/mouseUp actions don't work with the Closure event framework (not sure why), so export a
  // function to open the map context menu.
  goog.exportProperty(window, 'omcm', this.openMapContextMenu.bind(this));
};
goog.inherits(os.interaction.ContextMenu, os.ui.ol.interaction.ContextMenu);
os.implements(os.interaction.ContextMenu, os.I3DSupport.ID);

/**
 * @inheritDoc
 */
os.interaction.ContextMenu.prototype.is3DSupported = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.interaction.ContextMenu.prototype.handleEventInternal = function(event) {
  if (event.map && event.pixel) {
    var feature;
    var layer;

    if (event.pixel) {
      var result = event.map.forEachFeatureAtPixel(event.pixel, os.interaction.getFeatureResult);
      if (result) {
        feature = result.feature;
        layer = result.layer;
      }
    }

    if (feature) {
      this.openFeatureContextMenu(event, feature, layer);
    } else {
      // for the default map context menu, open it even if the pixel isn't available
      var pixel = event.pixel || [0, 0];
      var coord = event.map.getCoordinateFromPixel(pixel);

      if (coord) {
        coord = ol.proj.toLonLat(coord, os.map.PROJECTION);
        coord[0] = os.geo.normalizeLongitude(coord[0]);
        coord = ol.proj.fromLonLat(coord, os.map.PROJECTION);
      }

      this.openMapContextMenu(coord, pixel);
    }
  }
};
