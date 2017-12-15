goog.provide('os.command.LayerVisibility');
goog.require('os.command.AbstractSyncCommand');



/**
 * Sets the visibility for a layer.
 * @extends {os.command.AbstractSyncCommand}
 * @constructor
 * @param {string} id Layer ID
 * @param {boolean} vis Set visibility to
 */
os.command.LayerVisibility = function(id, vis) {
  os.command.LayerVisibility.base(this, 'constructor');
  this.title = (vis ? 'Show' : 'Hide') + ' Layer';

  /**
   * @type {string}
   * @private
   */
  this.id_ = id;
  /**
   * @type {boolean}
   * @private
   */
  this.vis_ = vis;
};
goog.inherits(os.command.LayerVisibility, os.command.AbstractSyncCommand);


/**
 * @inheritDoc
 */
os.command.LayerVisibility.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;
  var res = this.set(this.vis_);
  if (res) {
    this.finish();
  }
  return res;
};


/**
 * @inheritDoc
 */
os.command.LayerVisibility.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  var res = this.set(this.wasVis_);
  if (res) {
    os.command.LayerVisibility.base(this, 'revert');
  }
  return res;
};


/**
 * @param {boolean} vis
 * @return {boolean}
 */
os.command.LayerVisibility.prototype.set = function(vis) {
  var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.id_));
  if (!goog.isDefAndNotNull(layer)) {
    return this.handleError('No layer found with passed ID.');
  }
  var opt = layer.getLayerOptions();
  this.title += ' "' + opt['title'] + '"';
  this.wasVis_ = layer.getLayerVisible();
  layer.setLayerVisible(vis);
  return true;
};
