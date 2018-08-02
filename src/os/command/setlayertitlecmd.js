goog.provide('os.command.SetLayerTitle');
goog.require('os.command.AbstractSyncCommand');



/**
 * Set the title of a layer retrieved from the passed ID.
 * @extends {os.command.AbstractSyncCommand}
 * @constructor
 * @param {string} overlayId
 * @param {string} title
 */
os.command.SetLayerTitle = function(overlayId, title) {
  os.command.SetLayerTitle.base(this, 'constructor');
  this.title = 'Set Layer Title';

  /**
   * @type {string}
   * @private
   */
  this.overlayId_ = overlayId;
  /**
   * @type {string}
   * @private
   */
  this.title_ = title;
};
goog.inherits(os.command.SetLayerTitle, os.command.AbstractSyncCommand);


/**
 * @inheritDoc
 */
os.command.SetLayerTitle.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var l = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.overlayId_));
  if (!goog.isDefAndNotNull(l)) {
    return this.handleError('Layer not found for passed ID.');
  }
  this.oldTitle_ = l.getTitle();
  l.setTitle(this.title_);

  return this.finish();
};


/**
 * @inheritDoc
 */
os.command.SetLayerTitle.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var l = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.overlayId_));
  if (!goog.isDefAndNotNull(l)) {
    return this.handleError('Layer not found for passed ID.');
  }
  l.setTitle(this.oldTitle_);

  return os.command.SetLayerTitle.base(this, 'revert');
};
