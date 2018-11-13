goog.provide('plugin.vectortools.CopyLayer');

goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.feature');
goog.require('os.feature.DynamicFeature');



/**
 * Command for copying a vector layer
 * @constructor
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractSource}
 * @param {!string} sourceId The data source ID to copy
 * @param {plugin.vectortools.Options=} opt_options The feature options
 * @param {os.feature.DynamicFeature=} opt_track
 */
plugin.vectortools.CopyLayer = function(sourceId, opt_options, opt_track) {
  plugin.vectortools.CopyLayer.base(this, 'constructor', sourceId);
  this.title = 'Copy Layer';
  this.newLayerId_ = '';
  this.options_ = opt_options;
  this.track_ = opt_track;
};
goog.inherits(plugin.vectortools.CopyLayer, os.command.AbstractSource);


/**
 * @inheritDoc
 */
plugin.vectortools.CopyLayer.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var s = this.getSource();
    if (s instanceof os.source.Vector) {
      var source = /** @type {os.source.Vector} */ (s);

      // add the new layer
      var newLayer = plugin.vectortools.addNewLayer(source.getId());

      // keep track of its ID, use it for revert
      var newSource = /** @type {os.source.Vector} */ (newLayer.getSource());
      this.newLayerId_ = newSource.getId();

      // get a cloning function and use it to do the feature copy
      var cloneFunc = plugin.vectortools.getFeatureCloneFunction(this.newLayerId_);
      var features = plugin.vectortools.getFeatures(source, this.options_);
      newSource.addFeatures(features.map(cloneFunc));
      if (this.track_) {
        newSource.addFeature(this.track_);
      }

      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.vectortools.CopyLayer.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  // remove the layer by the layerId
  os.MapContainer.getInstance().removeLayer(this.newLayerId_);
  this.state = os.command.State.READY;
  return true;
};
