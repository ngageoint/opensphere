goog.provide('os.command.EditLayerFeatures');
goog.require('ol.Feature');
goog.require('os.command.AbstractSource');
goog.require('os.command.AbstractSyncCommand');
goog.require('os.command.State');



/**
 * @constructor
 * @extends {os.command.AbstractSyncCommand}
 * @param {string} layerId
 * @param {Array.<ol.Feature>} features
 * @param {boolean} addition Is this an addition or removal
 */
os.command.EditLayerFeatures = function(layerId, features, addition) {
  os.command.EditLayerFeatures.base(this, 'constructor');
  this.title = 'Add Features';

  /**
   * @type {Array.<ol.Feature>}
   * @private
   */
  this.features_ = features;
  /**
   * @type {string}
   * @private
   */
  this.layerId_ = layerId;
  /**
   * @type {boolean}
   * @private
   */
  this.addition_ = addition;

  if (this.layerId_ && this.features_) {
    this.title = (this.addition_ ? 'Add ' : 'Remove ') + this.features_.length +
        ' feature' + (this.features_.length === 1 ? '' : 's');
  }
};
goog.inherits(os.command.EditLayerFeatures, os.command.AbstractSyncCommand);


/**
 * @inheritDoc
 */
os.command.EditLayerFeatures.prototype.execute = function() {
  if (this.canExecute_()) {
    this.state = os.command.State.EXECUTING;

    var res = (this.addition_ ? this.add_() : this.remove_());
    if (res) {
      this.finish();
    }
    return res;
  }
  return false;
};


/**
 * @inheritDoc
 */
os.command.EditLayerFeatures.prototype.revert = function() {
  if (this.canExecute_()) {
    this.state = os.command.State.REVERTING;

    var res = (this.addition_ ? this.remove_() : this.add_());
    if (res) {
      os.command.EditLayerFeatures.base(this, 'revert');
    }
    return res;
  }
  return false;
};


/**
 * Adds features to the layer
 * @private
 * @return {boolean}
 */
os.command.EditLayerFeatures.prototype.add_ = function() {
  var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId_));
  if (goog.isDefAndNotNull(layer) && this.features_) {
    var source = /** @type {os.source.ISource} */ (layer.getSource());
    source.addFeatures(this.features_);
    return true;
  }
  return this.handleError('Layer is not defined .');
};


/**
 * Removes features from the layer.
 * @private
 * @return {boolean}
 */
os.command.EditLayerFeatures.prototype.remove_ = function() {
  var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId_));
  if (goog.isDefAndNotNull(layer)) {
    var source = /** @type {os.source.ISource} */ (layer.getSource());
    if (source) {
      // TODO: when OL3 gets its act together and has a removeFeatures() method to go along with
      // addFeatures(), use that
      for (var i = 0, n = this.features_.length; i < n; i++) {
        source.removeFeature(this.features_[i]);
      }
      return true;
    }
    return this.handleError('Source is not defined.');
  }
  return this.handleError('Layer is not defined.');
};


/**
 * Can this command execute
 * @private
 * @return {boolean}
 */
os.command.EditLayerFeatures.prototype.canExecute_ = function() {
  if (!(this.state === os.command.State.SUCCESS || this.state === os.command.State.READY)) {
    return this.handleError('Command not in good state.');
  }

  if (!this.features_) {
    return this.handleError('Features not provided');
  }
  return true;
};
