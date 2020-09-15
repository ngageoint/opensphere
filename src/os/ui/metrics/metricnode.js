goog.provide('os.ui.metrics.MetricNode');
goog.provide('os.ui.metrics.MetricNodeOptions');

goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.metrics.metricCompletionDirective');
goog.require('os.ui.slick.SlickTreeNode');


/**
 * @typedef {{
 *   label: !string,
 *   description: (string|undefined),
 *   key: (string|undefined),
 *   icon: (string|undefined),
 *   collapsed: (boolean|undefined)
 * }}
 */
os.ui.metrics.MetricNodeOptions;



/**
 * Tree nodes for layers
 *
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.data.ISearchable}
 * @param {string=} opt_key
 * @constructor
 */
os.ui.metrics.MetricNode = function(opt_key) {
  os.ui.metrics.MetricNode.base(this, 'constructor');
  this.setCheckboxVisible(false);

  /**
   * @type {string|undefined}
   * @private
   */
  this.key_ = opt_key;

  /**
   * @type {string|undefined}
   * @private
   */
  this.description_ = undefined;

  /**
   * @type {!function()}
   * @private
   */
  this.callback_;

  /**
   * @type {?string}
   */
  this.icon = null;

  /**
   * Indicates if a node has been visited.
   * @type {!boolean}
   * @private
   */
  this.visited_ = false;

  if (this.key_) {
    var metrics = os.metrics.Metrics.getInstance();
    this.setVisited(metrics.hasMetric(this.key_));

    metrics.listen(this.key_, this.onMetricChange_, false, this);
    metrics.listen(os.metrics.MetricsEventType.RESET, this.onMetricsReset_, false, this);
  }
};
goog.inherits(os.ui.metrics.MetricNode, os.ui.slick.SlickTreeNode);


/**
 * @inheritDoc
 */
os.ui.metrics.MetricNode.prototype.disposeInternal = function() {
  os.ui.metrics.MetricNode.base(this, 'disposeInternal');

  if (this.key_) {
    var metrics = os.metrics.Metrics.getInstance();
    metrics.unlisten(this.key_, this.onMetricChange_, false, this);
    metrics.unlisten(os.metrics.MetricsEventType.RESET, this.onMetricsReset_, false, this);
  }
};


/**
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.ui.metrics.MetricNode.prototype.onMetricChange_ = function(event) {
  if (typeof event.newVal == 'number') {
    this.setVisited(event.newVal > 0);
  }
};


/**
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.ui.metrics.MetricNode.prototype.onMetricsReset_ = function(event) {
  if (this.key_) {
    var metrics = os.metrics.Metrics.getInstance();
    this.setVisited(metrics.hasMetric(this.key_));
  }
};


/**
 * @return {string|undefined}
 */
os.ui.metrics.MetricNode.prototype.getDescription = function() {
  return this.description_;
};


/**
 * @param {string|undefined} description
 */
os.ui.metrics.MetricNode.prototype.setDescription = function(description) {
  this.description_ = description;
};


/**
 * @return {!function()}
 */
os.ui.metrics.MetricNode.prototype.getCallback = function() {
  return this.callback_;
};


/**
 * @param {!function()} callback
 */
os.ui.metrics.MetricNode.prototype.setCallback = function(callback) {
  this.callback_ = callback;
};


/**
 * @return {!boolean}
 */
os.ui.metrics.MetricNode.prototype.getVisited = function() {
  return this.visited_;
};


/**
 * @param {!boolean} visited
 */
os.ui.metrics.MetricNode.prototype.setVisited = function(visited) {
  if (visited != this.visited_) {
    this.visited_ = visited;
    this.dispatchEvent(new os.events.PropertyChangeEvent('visited', visited, !visited));
    this.dispatchEvent(new os.events.PropertyChangeEvent('label'));
  }
};


/**
 * @inheritDoc
 */
os.ui.metrics.MetricNode.prototype.getSearchText = function() {
  return [
    (this.getLabel() || ''),
    (this.getDescription() || ''),
    (this.getTags() || '')
  ].join(' ');
};


/**
 * @inheritDoc
 */
os.ui.metrics.MetricNode.prototype.getTags = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.ui.metrics.MetricNode.prototype.formatIcons = function() {
  if (!this.hasChildren()) {
    if (this.getVisited()) {
      return '<i class="fa fa-check"></i>';
    } else {
      return '<i class="fa fa-times"></i>';
    }
  }

  return this.icon || '&nbsp;';
};


/**
 * Returns this nodes icon, or empty string.
 *
 * @return {string}
 */
os.ui.metrics.MetricNode.prototype.getNodeIcon = function() {
  if (this.icon) {
    return /^<.*>/.test(this.icon) ?
      this.icon : '<i class="' + this.icon + '"></i>';
  }
  return '';
};


/**
 * @inheritDoc
 */
os.ui.metrics.MetricNode.prototype.formatValue = function(value) {
  var html = os.ui.metrics.MetricNode.base(this, 'formatValue', value);
  html += '<metriccompletion></metriccompletion>';
  return html;
};


/**
 * @return {!boolean}
 */
os.ui.metrics.MetricNode.prototype.getEnabled = function() {
  return true;
};


/**
 * @return {!boolean}
 */
os.ui.metrics.MetricNode.prototype.isLoading = function() {
  return false;
};
