goog.declareModuleId('os.command.LayerAutoRefresh');

import UrlTile from 'ol/src/source/UrlTile.js';

import {getMapContainer} from '../map/mapinstance.js';
import Metrics from '../metrics/metrics.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import VectorSource from '../source/vectorsource.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Command to change the automatic refresh for a source.
 *
 *
 * @implements {ICommand}
 */
export default class LayerAutoRefresh {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   */
  constructor(layerId, value) {
    this.isAsync = false;
    this.title = 'Change Layer Auto Refresh';
    this.details = null;
    this.state = State.READY;

    /**
     * The layer id to update.
     * @type {string}
     * @protected
     */
    this.layerId = layerId;

    /**
     * The old refresh interval.
     * @type {number}
     * @protected
     */
    this.oldInterval = 0;

    /**
     * The new refresh interval.
     * @type {number}
     * @protected
     */
    this.interval = value;
  }

  /**
   * Get the source from the layer id.
   *
   * @return {VectorSource|Source|UrlTile}
   * @protected
   */
  getSource() {
    var layer = getMapContainer().getLayer(this.layerId);
    if (!layer) {
      this.state = State.ERROR;
      this.details = 'Unable to locate layer with id "' + this.layerId + '".';
      return null;
    }

    var source = layer.getSource();
    if (!(source instanceof VectorSource || source instanceof UrlTile) ||
        !(/** @type {VectorSource|UrlTile} */ (source).isRefreshEnabled())) {
      this.state = State.ERROR;
      this.details = 'Source for layer with id "' + this.layerId + '" does not support refresh.';
      return null;
    }

    return source;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    var source = /** @type {VectorSource|UrlTile} */ (this.getSource());
    if (source) {
      this.oldInterval = source.getRefreshInterval();

      source.setRefreshInterval(this.interval);
      Metrics.getInstance().updateMetric(LayerKeys.VECTOR_AUTO_REFRESH, 1);

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
    var source = /** @type {VectorSource|UrlTile} */ (this.getSource());
    if (source) {
      source.setRefreshInterval(this.oldInterval);

      this.state = State.READY;
      return true;
    }

    return false;
  }
}
