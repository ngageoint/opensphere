goog.provide('plugin.basemap.TerrainNodeUICtrl');
goog.provide('plugin.basemap.terrainNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.node.DefaultLayerNodeUICtrl');


/**
 * @type {string}
 */
plugin.basemap.TerrainNodeUITemplate =
  '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
    '<span ng-if="nodeUi.isRemovable()" ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the terrain layer"></i></span>' +
    '</span>' +
  '</span>';


/**
 * The terrain layer node UI.
 * @return {angular.Directive}
 */
plugin.basemap.terrainNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: plugin.basemap.TerrainNodeUITemplate,
    controller: plugin.basemap.TerrainNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('terrainnodeui', [plugin.basemap.terrainNodeUIDirective]);



/**
 * Controller for the terrain layer node UI.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.node.DefaultLayerNodeUICtrl}
 * @constructor
 * @ngInject
 */
plugin.basemap.TerrainNodeUICtrl = function($scope, $element) {
  plugin.basemap.TerrainNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.basemap.TerrainNodeUICtrl, os.ui.node.DefaultLayerNodeUICtrl);


/**
 * Remove the terrain layer.
 * @override
 * @export
 */
plugin.basemap.TerrainNodeUICtrl.prototype.remove = function() {
  // remove the layer via setting change
  os.settings.set(os.config.DisplaySetting.ENABLE_TERRAIN, false);
};
