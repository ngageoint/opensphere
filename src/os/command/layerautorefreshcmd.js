goog.provide('os.command.LayerAutoRefresh');

goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Command to change the automatic refresh for a source.
 * @param {string} layerId
 * @param {number} value
 *
 * @implements {os.command.ICommand}
 * @constructor
 */
os.command.LayerAutoRefresh = function(layerId, value) {
  this.isAsync = false;
  this.title = 'Change Layer Auto Refresh';
  this.details = null;
  this.state = os.command.State.READY;

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
};


/**
 * Get the source from the layer id.
 * @return {os.source.Vector|ol.source.UrlTile}
 * @protected
 */
os.command.LayerAutoRefresh.prototype.getSource = function() {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (!layer) {
    this.state = os.command.State.ERROR;
    this.details = 'Unable to locate layer with id "' + this.layerId + '".';
    return null;
  }

  var source = layer.getSource();
  if (!(source instanceof os.source.Vector || source instanceof ol.source.UrlTile) || !source.isRefreshEnabled()) {
    this.state = os.command.State.ERROR;
    this.details = 'Source for layer with id "' + this.layerId + '" does not support refresh.';
    return null;
  }

  return source;
};


/**
 * @inheritDoc
 */
os.command.LayerAutoRefresh.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var source = this.getSource();
  if (source) {
    this.oldInterval = source.getRefreshInterval();

    source.setRefreshInterval(this.interval);
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.Layer.VECTOR_AUTO_REFRESH, 1);

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.LayerAutoRefresh.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  var source = this.getSource();
  if (source) {
    source.setRefreshInterval(this.oldInterval);

    this.state = os.command.State.READY;
    return true;
  }

  return false;
};
