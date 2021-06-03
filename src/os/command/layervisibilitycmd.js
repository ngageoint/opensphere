goog.module('os.command.LayerVisibility');
goog.module.declareLegacyNamespace();

const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');


/**
 * Sets the visibility for a layer.
 */
class LayerVisibility extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {string} id Layer ID
   * @param {boolean} vis Set visibility to
   */
  constructor(id, vis) {
    super();
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
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = os.command.State.EXECUTING;
    var res = this.set(this.vis_);
    if (res) {
      this.finish();
    }
    return res;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = os.command.State.REVERTING;
    var res = this.set(this.wasVis_);
    if (res) {
      super.revert();
    }
    return res;
  }

  /**
   * @param {boolean} vis
   * @return {boolean}
   */
  set(vis) {
    var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.id_));
    if (layer == null) {
      return this.handleError('No layer found with passed ID.');
    }
    var opt = layer.getLayerOptions();
    this.title += ' "' + opt['title'] + '"';
    this.wasVis_ = layer.getLayerVisible();
    layer.setLayerVisible(vis);
    return true;
  }
}

exports = LayerVisibility;
