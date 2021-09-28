goog.declareModuleId('os.ui.metrics.MetricNode');

import {registerClass} from '../../classregistry.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import {MetricsEventType} from '../../metrics/index.js';
import Metrics from '../../metrics/metrics.js';
import SlickTreeNode from '../slick/slicktreenode.js';
import {directiveTag} from './metriccompletion.js';
import {ClassName} from './metricsui.js';

const {default: ISearchable} = goog.requireType('os.data.ISearchable');


/**
 * Tree nodes for layers
 *
 * @implements {ISearchable}
 */
export default class MetricNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {string=} opt_key
   */
  constructor(opt_key) {
    super();
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
      var metrics = Metrics.getInstance();
      this.setVisited(metrics.hasMetric(this.key_));

      metrics.listen(this.key_, this.onMetricChange_, false, this);
      metrics.listen(MetricsEventType.RESET, this.onMetricsReset_, false, this);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.key_) {
      var metrics = Metrics.getInstance();
      metrics.unlisten(this.key_, this.onMetricChange_, false, this);
      metrics.unlisten(MetricsEventType.RESET, this.onMetricsReset_, false, this);
    }
  }

  /**
   * @param {os.events.SettingChangeEvent} event
   * @private
   */
  onMetricChange_(event) {
    if (typeof event.newVal == 'number') {
      this.setVisited(event.newVal > 0);
    }
  }

  /**
   * @param {os.events.SettingChangeEvent} event
   * @private
   */
  onMetricsReset_(event) {
    if (this.key_) {
      var metrics = Metrics.getInstance();
      this.setVisited(metrics.hasMetric(this.key_));
    }
  }

  /**
   * @return {string|undefined}
   */
  getDescription() {
    return this.description_;
  }

  /**
   * @param {string|undefined} description
   */
  setDescription(description) {
    this.description_ = description;
  }

  /**
   * @return {!function()}
   */
  getCallback() {
    return this.callback_;
  }

  /**
   * @param {!function()} callback
   */
  setCallback(callback) {
    this.callback_ = callback;
  }

  /**
   * @return {!boolean}
   */
  getVisited() {
    return this.visited_;
  }

  /**
   * @param {!boolean} visited
   */
  setVisited(visited) {
    if (visited != this.visited_) {
      this.visited_ = visited;
      this.dispatchEvent(new PropertyChangeEvent('visited', visited, !visited));
      this.dispatchEvent(new PropertyChangeEvent('label'));
    }
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    return [
      (this.getLabel() || ''),
      (this.getDescription() || ''),
      (this.getTags() || '')
    ].join(' ');
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return null;
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    if (!this.hasChildren()) {
      if (this.getVisited()) {
        return '<i class="fa fa-check"></i>';
      } else {
        return '<i class="fa fa-times"></i>';
      }
    }

    return this.icon || '&nbsp;';
  }

  /**
   * Returns this nodes icon, or empty string.
   *
   * @return {string}
   */
  getNodeIcon() {
    if (this.icon) {
      return /^<.*>/.test(this.icon) ?
        this.icon : '<i class="' + this.icon + '"></i>';
    }
    return '';
  }

  /**
   * @inheritDoc
   */
  formatValue(value) {
    var html = super.formatValue(value);
    html += `<${directiveTag}></${directiveTag}>`;
    return html;
  }

  /**
   * @return {!boolean}
   */
  getEnabled() {
    return true;
  }

  /**
   * @return {!boolean}
   */
  isLoading() {
    return false;
  }
}

registerClass(ClassName.METRIC_NODE, MetricNode);
