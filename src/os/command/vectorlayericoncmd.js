goog.provide('os.command.VectorLayerIcon');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');
goog.require('os.ui.file.kml');



/**
 * Configure a vector layer to display an icon.
 * @param {string} layerId The layer id.
 * @param {osx.icon.Icon} icon The new icon.
 * @param {osx.icon.Icon=} opt_oldIcon The old icon.
 * @extends {os.command.AbstractVectorStyle}
 * @constructor
 */
os.command.VectorLayerIcon = function(layerId, icon, opt_oldIcon) {
  os.command.VectorLayerIcon.base(this, 'constructor', layerId, icon, opt_oldIcon);
  this.title = 'Change Icon';
  this.metricKey = os.metrics.Layer.VECTOR_ICON;
};
goog.inherits(os.command.VectorLayerIcon, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerIcon.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return os.style.getConfigIcon(config) || os.ui.file.kml.getDefaultIcon();
};


/**
 * @inheritDoc
 */
os.command.VectorLayerIcon.prototype.applyValue = function(config, value) {
  if (value) {
    os.style.setConfigIcon(config, value);
  }

  os.command.VectorLayerIcon.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerIcon.prototype.finish = function(config) {
  var source = os.osDataManager.getSource(this.layerId);
  if (source) {
    source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.GEOMETRY_SHAPE));
  }

  os.command.VectorLayerIcon.base(this, 'finish', config);
};
