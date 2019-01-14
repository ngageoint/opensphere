goog.provide('plugin.im.action.feature.ui.FeatureActionsCtrl');
goog.provide('plugin.im.action.feature.ui.featureActionsDirective');

goog.require('os.source');
goog.require('os.ui.Module');
goog.require('os.ui.im.action.FilterActionsCtrl');
goog.require('plugin.im.action.feature');
goog.require('plugin.im.action.feature.node');


/**
 * The featureactions directive
 * @return {angular.Directive}
 */
plugin.im.action.feature.ui.featureActionsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/im/action/importactions.html',
    controller: plugin.im.action.feature.ui.FeatureActionsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('featureactions', [plugin.im.action.feature.ui.featureActionsDirective]);



/**
 * Controller function for the featureactions directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.im.action.FilterActionsCtrl<ol.Feature>}
 * @constructor
 * @ngInject
 */
plugin.im.action.feature.ui.FeatureActionsCtrl = function($scope, $element) {
  /**
   * The context menu for feature action nodes.
   * @type {os.ui.menu.Menu<os.ui.menu.layer.Context>|undefined}
   */
  this['contextMenu'] = plugin.im.action.feature.node.MENU;

  plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'constructor', $scope, $element);
  os.dataManager.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
};
goog.inherits(plugin.im.action.feature.ui.FeatureActionsCtrl, os.ui.im.action.FilterActionsCtrl);


/**
 * Close the feature action window if the source was removed
 * @param {os.data.event.DataEvent} event
 * @private
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.onSourceRemoved_ = function(event) {
  if (event && event.source) {
    if (this.entryType && this.entryType == event.source.getId()) {
      this.close();
    }
  }
};


/**
 * @inheritDoc
 * @export
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.close = function() {
  plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'close');
  os.dataManager.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
};


/**
 * @inheritDoc
 * @export
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.apply = function() {
  plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'apply');

  if (this.entryType) {
    var dm = os.data.DataManager.getInstance();
    var source = dm.getSource(this.entryType);
    if (source) {
      var manager = plugin.im.action.feature.Manager.getInstance();
      manager.processItems(source.getId(), source.getFeatures(), true);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.getColumns = function() {
  return plugin.im.action.feature.getColumns(this.entryType);
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.getExportName = function() {
  return plugin.im.action.feature.getExportName(this.entryType);
};


/**
 * @inheritDoc
 * @export
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.editEntry = function(opt_entry) {
  if (this.entryType) {
    plugin.im.action.feature.editEntry(this.entryType, opt_entry);
  }
};
