goog.provide('os.ui.metrics.MetricsContainerCtrl');
goog.provide('os.ui.metrics.MetricsContainerDirective');

goog.require('goog.async.Delay');
goog.require('os.metrics.Metrics');
goog.require('os.structs.ITreeNode');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingDefaultUICtrl');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.config.SettingsManager');
goog.require('os.ui.config.SettingsManagerEventType');
goog.require('os.ui.data.AddDataCtrl');
goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.metricDetailsDirective');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.TreeSearch');
goog.require('os.ui.uiSwitchDirective');


/**
 * The stateexport window directive
 * @return {angular.Directive}
 */
os.ui.metrics.metricsContainerDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/config/metricscontainer.html',
    controller: os.ui.metrics.MetricsContainerCtrl,
    controllerAs: 'setCon'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('metrics', [os.ui.metrics.metricsContainerDirective]);



/**
 * Controller for the save export window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.data.AddDataCtrl}
 * @constructor
 * @ngInject
 */
os.ui.metrics.MetricsContainerCtrl = function($scope, $element, $timeout) {
  os.ui.metrics.MetricsContainerCtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {os.ui.metrics.MetricsManager}
   * @private
   */
  this.metricsManager_ = os.ui.metrics.MetricsManager.getInstance();

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {Array.<os.ui.slick.SlickTreeNode>}
   */
  this.scope['metricsNodes'] = null;

  /**
   * @type {os.ui.metrics.MetricNode}
   */
  this.scope['selected'] = null;

  /**
   * @type {string}
   */
  this['details'] = '';

  this.metricsManager_.listen(os.ui.metrics.MetricsManagerEventType.METRIC_ADDED, this.refresh_, false, this);
  this.metricsManager_.listen(os.ui.metrics.MetricsManagerEventType.METRIC_CHANGE, this.refresh_, false, this);
  this.refresh_();
};
goog.inherits(os.ui.metrics.MetricsContainerCtrl, os.ui.data.AddDataCtrl);


/**
 * @inheritDoc
 */
os.ui.metrics.MetricsContainerCtrl.prototype.onDestroy = function() {
  this.scope['metricsNodes'] = null;

  os.ui.metrics.MetricsContainerCtrl.base(this, 'onDestroy');

  this.timeout_ = null;

  this.metricsManager_.unlisten(os.ui.metrics.MetricsManagerEventType.METRIC_ADDED, this.refresh_, false, this);
  this.metricsManager_.unlisten(os.ui.metrics.MetricsManagerEventType.METRIC_CHANGE, this.refresh_, false, this);
  this.metricsManager = null;
};


/**
 * @inheritDoc
 */
os.ui.metrics.MetricsContainerCtrl.prototype.initTreeSearch = function() {
  var root = os.ui.metrics.MetricsManager.getInstance().getRootNode();
  var search = root.getChildren() || [];
  return new os.ui.slick.TreeSearch(search, 'metricsNodes', this.scope);
};


/**
 * @inheritDoc
 */
os.ui.metrics.MetricsContainerCtrl.prototype.initRoot = function() {
  return os.ui.metrics.MetricsManager.getInstance().getRootNode();
};


/**
 * Save the metrics
 * @private
 */
os.ui.metrics.MetricsContainerCtrl.prototype.save_ = function() {
  os.metrics.Metrics.getInstance().save();
};
goog.exportProperty(os.ui.metrics.MetricsContainerCtrl.prototype, 'save',
    os.ui.metrics.MetricsContainerCtrl.prototype.save_);


/**
 * @private
 */
os.ui.metrics.MetricsContainerCtrl.prototype.refresh_ = function() {
  this.scope['metricsNodes'] = this.metricsManager_.getRootNode().getChildren();

  this.timeout_(goog.bind(function() {
    this.scope['selected'] = this.metricsManager_.getSelected();

    if (!this.scope['selected']) {
      // nothing selected - select the first setting
      this.scope['selected'] = this.metricsManager_.initSelection();
    }
  }, this));
};
