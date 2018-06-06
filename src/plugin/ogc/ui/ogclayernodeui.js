goog.provide('plugin.ogc.ui.OGCLayerNodeUICtrl');
goog.provide('plugin.ogc.ui.ogcLayerNodeUIDirective');
goog.require('goog.async.Deferred');
goog.require('goog.events.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.node.DefaultLayerNodeUICtrl');
goog.require('os.ui.node.defaultLayerNodeUIDirective');
goog.require('plugin.ogc.ui.chooseTimeColumnDirective');


/**
 * @type {string}
 */
plugin.ogc.ui.OGCLayerNodeUITemplate = '<span ng-if="chooseTime" ng-click="nodeUi.chooseTime()">' +
    '<i class="fa fa-clock-o fa-fw glyph" title="Choose Time Columns"></i></span>';


/**
 * @return {angular.Directive}
 */
plugin.ogc.ui.ogcLayerNodeUIDirective = function() {
  var dir = os.ui.node.defaultLayerNodeUIDirective();
  dir.template = dir.template.replace('>', '>' + plugin.ogc.ui.OGCLayerNodeUITemplate);
  dir.controller = plugin.ogc.ui.OGCLayerNodeUICtrl;
  return dir;
};


/**
 * Add the directive tot he module
 */
os.ui.Module.directive('ogclayernodeui', [plugin.ogc.ui.ogcLayerNodeUIDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @extends {os.ui.node.DefaultLayerNodeUICtrl}
 * @ngInject
 */
plugin.ogc.ui.OGCLayerNodeUICtrl = function($scope, $element) {
  plugin.ogc.ui.OGCLayerNodeUICtrl.base(this, 'constructor', $scope, $element);

  /**
   * The descriptor for this layer
   * @type {os.data.IDataDescriptor}
   * @private
   */
  this.descriptor_ = os.dataManager.getDescriptor(this.getLayerId());

  var chooseTime = false;

  if (os.implements(this.descriptor_, os.ui.ogc.IFeatureTypeDescriptor.ID)
      && os.implements(this.descriptor_, os.ui.ogc.wms.IWMSLayer.ID)) {
    var featureType = this.descriptor_.getFeatureType();
    if (featureType) {
      chooseTime = this.descriptor_.hasTimeExtent() && featureType.getTimeColumns().length >= 2 &&
          featureType.getStartDateColumnName() != 'validTime';
    }
  }
  $scope['chooseTime'] = chooseTime;
};
goog.inherits(plugin.ogc.ui.OGCLayerNodeUICtrl, os.ui.node.DefaultLayerNodeUICtrl);


/**
 * Launch the time column chooser for the layer
 */
plugin.ogc.ui.OGCLayerNodeUICtrl.prototype.chooseTime = function() {
  var deferred = new goog.async.Deferred();
  deferred.addCallback(function() {
    this.descriptor_.setActive(false);
    this.descriptor_.setActive(true);
  }, this);
  plugin.ogc.ui.ChooseTimeColumnCtrl.launch(this.getLayerId(), deferred);
};
goog.exportProperty(plugin.ogc.ui.OGCLayerNodeUICtrl.prototype, 'chooseTime',
    plugin.ogc.ui.OGCLayerNodeUICtrl.prototype.chooseTime);
