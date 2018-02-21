goog.provide('plugin.track.TrackLayer');

goog.require('plugin.file.kml.KMLLayer');
goog.require('plugin.track.ui.trackNodeUIDirective');



/**
 * Layer used to maintain saved tracks.
 * @param {olx.layer.VectorOptions} options Vector layer options
 * @extends {plugin.file.kml.KMLLayer}
 * @constructor
 */
plugin.track.TrackLayer = function(options) {
  plugin.track.TrackLayer.base(this, 'constructor', options);
  this.setLayerUI('');

  // TODO: this will allow creating folders, but folders will have an add placemark button
  // this.setNodeUI('<tracknodeui></tracknodeui>');

  this.editable = true;
  this.showRoot = false;

  // TODO (THIN-8156): render each track in the legend
  this.renderLegend = goog.nullFunction;
};
goog.inherits(plugin.track.TrackLayer, plugin.file.kml.KMLLayer);
