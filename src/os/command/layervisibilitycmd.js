goog.declareModuleId('os.command.LayerVisibility');

import {getMapContainer} from '../map/mapinstance.js';
import AbstractSyncCommand from './abstractsynccommand.js';
import State from './state.js';

const {default: VectorLayer} = goog.requireType('os.layer.Vector');


/**
 * Sets the visibility for a layer.
 */
export default class LayerVisibility extends AbstractSyncCommand {
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

    /**
     * @type {boolean}
     * @private
     */
    this.wasVis_ = !vis;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;
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
    this.state = State.REVERTING;
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
    var layer = /** @type {VectorLayer} */ (getMapContainer().getLayer(this.id_));
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
