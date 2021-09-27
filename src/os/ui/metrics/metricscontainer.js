goog.declareModuleId('os.ui.metrics.MetricsContainerUI');

import './metricdetails.js';
import {ROOT} from '../../os.js';
import AddDataCtrl from '../data/adddatactrl.js';
import Module from '../module.js';
import TreeSearch from '../slick/treesearch.js';
import MetricsManager from './metricsmanager.js';
import MetricsManagerEventType from './metricsmanagereventtype.js';
const Metrics = goog.require('os.metrics.Metrics');

const {default: MetricNode} = goog.requireType('os.ui.metrics.MetricNode');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * The metrics container directive.
 *
 * @return {angular.Directive}
 */
export const directive = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: ROOT + 'views/config/metricscontainer.html',
    controller: Controller,
    controllerAs: 'setCon'
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'metrics';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the metrics container.
 * @unrestricted
 */
export class Controller extends AddDataCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element);

    /**
     * @type {MetricsManager}
     * @private
     */
    this.metricsManager_ = MetricsManager.getInstance();

    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * @type {Array<SlickTreeNode>}
     */
    this.scope['metricsNodes'] = null;

    /**
     * @type {MetricNode}
     */
    this.scope['selected'] = null;

    /**
     * @type {string}
     */
    this['details'] = '';

    this.metricsManager_.listen(MetricsManagerEventType.METRIC_ADDED, this.refresh_, false, this);
    this.metricsManager_.listen(MetricsManagerEventType.METRIC_CHANGE, this.refresh_, false, this);
    this.refresh_();
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    this.scope['metricsNodes'] = null;

    super.onDestroy();

    this.timeout_ = null;

    this.metricsManager_.unlisten(MetricsManagerEventType.METRIC_ADDED, this.refresh_, false, this);
    this.metricsManager_.unlisten(MetricsManagerEventType.METRIC_CHANGE, this.refresh_, false, this);
    this.metricsManager = null;
  }

  /**
   * @inheritDoc
   */
  initTreeSearch() {
    var root = MetricsManager.getInstance().getRootNode();
    var search = root.getChildren() || [];
    return new TreeSearch(search, 'metricsNodes', this.scope);
  }

  /**
   * @inheritDoc
   */
  initRoot() {
    return MetricsManager.getInstance().getRootNode();
  }

  /**
   * Save the metrics
   *
   * @export
   */
  save() {
    Metrics.getInstance().save();
  }

  /**
   * @private
   */
  refresh_() {
    this.scope['metricsNodes'] = this.metricsManager_.getRootNode().getChildren();

    this.timeout_(function() {
      this.scope['selected'] = this.metricsManager_.getSelected();

      if (!this.scope['selected']) {
        // nothing selected - select the first setting
        this.scope['selected'] = this.metricsManager_.initSelection();
      }
    }.bind(this));
  }
}
