goog.provide('plugin.im.action.feature.ui.FeatureActionsCtrl');
goog.provide('plugin.im.action.feature.ui.featureActionsDirective');

goog.require('os.source');
goog.require('os.ui.Module');
goog.require('os.ui.im.action.FilterActionsCtrl');
goog.require('os.ui.util.autoHeightDirective');


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
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.close = function() {
  plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'close');
  os.dataManager.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
};
goog.exportProperty(
    plugin.im.action.feature.ui.FeatureActionsCtrl.prototype,
    'close',
    plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.close);


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.apply = function() {
  plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'apply');

  if (this.entryType) {
    var dm = os.data.DataManager.getInstance();
    var source = dm.getSource(this.entryType);
    if (source) {
      source.refresh();
    }
  }
};
goog.exportProperty(
    plugin.im.action.feature.ui.FeatureActionsCtrl.prototype,
    'apply',
    plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.apply);


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.getColumns = function() {
  var columns;

  if (this.entryType) {
    var dm = os.data.DataManager.getInstance();
    var source = dm.getSource(this.entryType);
    if (source) {
      columns = os.source.getFilterColumns(source, true);
    }
  }

  return columns || plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'getColumns');
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.FeatureActionsCtrl.prototype.getExportName = function() {
  var name = plugin.im.action.feature.ui.FeatureActionsCtrl.base(this, 'getExportName');

  if (this.entryType) {
    var layer = os.MapContainer.getInstance().getLayer(this.entryType);
    if (os.implements(layer, os.layer.ILayer.ID)) {
      var layerTitle = /** @type {os.layer.ILayer} */ (layer).getTitle();
      if (layerTitle) {
        name = layerTitle + ' ' + name;
      }
    }
  }

  return name;
};
