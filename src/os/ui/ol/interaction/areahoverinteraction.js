goog.provide('os.ui.ol.interaction.AreaHover');

goog.require('ol.ViewHint');
goog.require('ol.events.condition');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Vector');
goog.require('os.style.area');
goog.require('os.time.TimelineController');
goog.require('os.ui.ol.interaction');



/**
 * Handles hover/highlight of areas
 * @constructor
 * @extends {ol.interaction.Select}
 * @param {olx.interaction.SelectOptions=} opt_options Options.
 */
os.ui.ol.interaction.AreaHover = function(opt_options) {
  os.ui.ol.interaction.AreaHover.base(this, 'constructor', opt_options);
  this.handleEvent = os.ui.ol.interaction.AreaHover.handleEvent_;

  var options = opt_options || {};
  this.condition = options.condition || ol.events.condition.pointerMove;
};
goog.inherits(os.ui.ol.interaction.AreaHover, ol.interaction.Select);


/**
 * @param {ol.MapBrowserEvent} event Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 * @this os.ui.ol.interaction.AreaHover
 * @private
 */
os.ui.ol.interaction.AreaHover.handleEvent_ = function(event) {
  if (!this.condition(event)) {
    return true;
  }

  var container = $('#map-container');
  container.css('cursor', 'auto');

  var map = event.map;
  var tlc = os.time.TimelineController.getInstance();

  if (map.getView().getHints()[ol.ViewHint.INTERACTING] <= 0 && !tlc.isPlaying()) {
    var feature = os.ui.ol.interaction.getEventFeature(event, os.ui.ol.interaction.getFirstPolygon);
    if (feature) {
      os.ui.areaManager.highlight(feature);
      container.css('cursor', 'pointer');
    }

    var layers = map.getLayers().getArray();
    var source = null;
    // get the drawing layer/source
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.get('id') == os.ui.ol.OLMap.DRAW_ID && layer instanceof ol.layer.Vector) {
        source = /** @type {ol.layer.Vector} */ (layer).getSource();
        break;
      }
    }

    if (source) {
      var features = source.getFeatures();
      for (var i = 0, n = features.length; i < n; i++) {
        var f = features[i];
        if (feature !== f) {
          if (f.getStyle() === os.style.area.HOVER_STYLE) {
            os.ui.areaManager.unhighlight(f);
          }
        }
      }
    }
  }

  return true;
};
