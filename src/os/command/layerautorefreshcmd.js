goog.module('os.command.LayerAutoRefresh');
goog.module.declareLegacyNamespace();

const UrlTile = goog.require('ol.source.UrlTile');
const State = goog.require('os.command.State');
const {getMapContainer} = goog.require('os.map.instance');
const metrics = goog.require('os.metrics');
const Metrics = goog.require('os.metrics.Metrics');
const VectorSource = goog.require('os.source.Vector');

const Source = goog.requireType('ol.source.Source');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command to change the automatic refresh for a source.
 *
 *
 * @implements {ICommand}
 */
class LayerAutoRefresh {
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
      Metrics.getInstance().updateMetric(metrics.Layer.VECTOR_AUTO_REFRESH, 1);

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

exports = LayerAutoRefresh;
