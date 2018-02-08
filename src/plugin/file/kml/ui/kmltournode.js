goog.provide('plugin.file.kml.ui.KMLTourNode');

goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.kmlTourNodeUIDirective');


/**
 * Tree node for a KML tour.
 * @param {!plugin.file.kml.tour.Tour} tour The KML tour.
 * @extends {plugin.file.kml.ui.KMLNode}
 * @constructor
 */
plugin.file.kml.ui.KMLTourNode = function(tour) {
  plugin.file.kml.ui.KMLTourNode.base(this, 'constructor');
  this.setCheckboxVisible(false);
  this.nodeUI = '<kmltournodeui></kmltournodeui>';

  /**
   * The KML tour.
   * @type {plugin.file.kml.tour.Tour|undefined}
   * @private
   */
  this.tour_ = tour;
};
goog.inherits(plugin.file.kml.ui.KMLTourNode, plugin.file.kml.ui.KMLNode);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLTourNode.prototype.disposeInternal = function() {
  plugin.file.kml.ui.KMLTourNode.base(this, 'disposeInternal');

  goog.dispose(this.tour_);
  this.tour_ = undefined;
};


/**
 * Get the KML tour object for the node.
 * @return {plugin.file.kml.tour.Tour|undefined}
 */
plugin.file.kml.ui.KMLTourNode.prototype.getTour = function() {
  return this.tour_;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLTourNode.prototype.getLabel = function() {
  if (this.tour_) {
    return this.tour_['name'];
  }

  return plugin.file.kml.ui.KMLTourNode.base(this, 'getLabel');
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLTourNode.prototype.getToolTip = function() {
  if (this.tour_) {
    return this.tour_['description'];
  }

  return plugin.file.kml.ui.KMLTourNode.base(this, 'getToolTip');
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLTourNode.prototype.formatIcons = function() {
  return '<i class="fa fa-video-camera fa-fw" title="KML Tour"></i>';
};
