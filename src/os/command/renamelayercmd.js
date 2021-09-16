goog.module('os.command.RenameLayer');

const GoogEvent = goog.require('goog.events.Event');
const State = goog.require('os.command.State');
const LayerEventType = goog.require('os.events.LayerEventType');
const osImplements = goog.require('os.implements');
const {getMapContainer} = goog.require('os.map.instance');
const ISource = goog.require('os.source.ISource');

const ICommand = goog.requireType('os.command.ICommand');
const ILayer = goog.requireType('os.layer.ILayer');


/**
 * @implements {ICommand}
 */
class RenameLayer {
  /**
   * Constructor.
   * @param {!ILayer} layer
   * @param {string} newName
   * @param {string} oldName
   */
  constructor(layer, newName, oldName) {
    /**
     * @type {ILayer}
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
     * @type {State}
     */
    this.state = State.READY;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.state === State.READY) {
      this.state = State.EXECUTING;
      this.renameLayer_(this.newName_);
      this.state = State.SUCCESS;
      return true;
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    this.renameLayer_(this.oldName_);
    this.state = State.SUCCESS;

    if (this.layer_) {
      this.renameLayer_(this.oldName_);
      this.state = State.READY;
      return true;
    }
    return false;
  }

  /**
   * Apply the name change
   *
   * @param {string} name
   * @private
   */
  renameLayer_(name) {
    this.layer_.setTitle(name);
    var source = /** @type {ol.layer.Layer} */ (this.layer_).getSource();
    if (osImplements(source, ISource.ID)) {
      /** @type {ISource} */ (source).setTitle(name);
      getMapContainer().dispatchEvent(new GoogEvent(LayerEventType.RENAME));
    }
  }
}

exports = RenameLayer;
