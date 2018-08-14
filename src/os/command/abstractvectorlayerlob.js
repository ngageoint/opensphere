goog.provide('os.command.AbstractVectorLayerLOB');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.source.PropertyChange');



/**
 * Commands for vector line of bearing style changes should extend this class
 *
 * @param {string} layerId
 * @param {T} value
 * @param {T=} opt_oldValue
 *
 * @extends {os.command.AbstractVectorStyle}
 * @constructor
 * @template T
 */
os.command.AbstractVectorLayerLOB = function(layerId, value, opt_oldValue) {
  os.command.AbstractVectorLayerLOB.base(this, 'constructor', layerId, value, opt_oldValue);
};
goog.inherits(os.command.AbstractVectorLayerLOB, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.command.AbstractVectorLayerLOB.prototype.applyValue = function(config, value) {
  var source = os.osDataManager.getSource(this.layerId);
  if (source) {
    var features = source.getFeatures();
    for (var i = 0, n = features.length; i < n; i++) { // wipe LOB styles
      features[i].values_[os.data.RecordField.LINE_OF_BEARING] = null;
      features[i].values_[os.data.RecordField.LINE_OF_BEARING_ERROR_HIGH] = null;
      features[i].values_[os.data.RecordField.LINE_OF_BEARING_ERROR_LOW] = null;
      features[i].values_[os.data.RecordField.ELLIPSE] = null;
    }
  }
  os.command.AbstractVectorLayerLOB.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.AbstractVectorLayerLOB.prototype.finish = function(config) {
  var source = os.osDataManager.getSource(this.layerId);
  if (source) {
    var shape = source.getGeometryShape();
    source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.GEOMETRY_SHAPE, shape));
  }

  os.command.AbstractVectorLayerLOB.base(this, 'finish', config);
};
