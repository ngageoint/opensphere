goog.provide('os.command.RenameLayer');

goog.require('goog.events.Event');
goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.events.LayerEventType');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.query.QueryManager');
goog.require('os.source.ISource');



/**
 * @constructor
 * @implements {os.command.ICommand}
 * @param {!os.layer.ILayer} layer
 * @param {string} newName
 * @param {string} oldName
 */
os.command.RenameLayer = function(layer, newName, oldName) {
  /**
   * @type {os.layer.ILayer}
   * @private
   */
  this.layer_ = layer;

  /**
   * @type {string}
   * @private
   */
  this.newName_ = newName;

  /**
   * @type {string}
   * @private
   */
  this.oldName_ = oldName;

  /**
   * @type {string}
   */
  this.title = 'Rename layer from ' + this.oldName_ + ' to ' + this.newName_;

  /**
   * @inheritDoc
   */
  this.details = this.title;

  /**
   * @inheritDoc
   */
  this.isAsync = false;

  /**
   * @type {os.command.State}
   */
  this.state = os.command.State.READY;
};


/**
 * @inheritDoc
 */
os.command.RenameLayer.prototype.execute = function() {
  if (this.state === os.command.State.READY) {
    this.state = os.command.State.EXECUTING;
    this.renameLayer_(this.newName_);
    this.state = os.command.State.SUCCESS;
    return true;
  }
  return false;
};


/**
 * @inheritDoc
 */
os.command.RenameLayer.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  this.renameLayer_(this.oldName_);
  this.state = os.command.State.SUCCESS;

  if (this.layer_) {
    this.renameLayer_(this.oldName_);
    this.state = os.command.State.READY;
    return true;
  }
  return false;
};


/**
 * Apply the name change
 * @param {string} name
 * @private
 */
os.command.RenameLayer.prototype.renameLayer_ = function(name) {
  this.layer_.setTitle(name);
  var source = /** @type {ol.layer.Layer} */ (this.layer_).getSource();
  if (os.implements(source, os.source.ISource.ID)) {
    /** @type {os.source.ISource} */ (source).setTitle(name);
    os.MapContainer.getInstance().dispatchEvent(new goog.events.Event(os.events.LayerEventType.RENAME));
  }
};
