goog.module('os.command.SetLayerTitle');
goog.module.declareLegacyNamespace();

const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');
const State = goog.require('os.command.State');
const {getMapContainer} = goog.require('os.map.instance');


/**
 * Set the title of a layer retrieved from the passed ID.
 */
class SetLayerTitle extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {string} overlayId
   * @param {string} title
   */
  constructor(overlayId, title) {
    super();
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

    /**
     * @type {string}
     * @private
     */
    this.oldTitle_ = '';
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    var l = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.overlayId_));
    if (l == null) {
      return this.handleError('Layer not found for passed ID.');
    }
    this.oldTitle_ = l.getTitle();
    l.setTitle(this.title_);

    return this.finish();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var l = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.overlayId_));
    if (l == null) {
      return this.handleError('Layer not found for passed ID.');
    }
    l.setTitle(this.oldTitle_);

    return super.revert();
  }
}

exports = SetLayerTitle;
