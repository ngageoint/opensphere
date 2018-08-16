goog.provide('plugin.places.ui.PlacesNodeUICtrl');
goog.provide('plugin.places.ui.placesNodeUIDirective');

goog.require('goog.events.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.node.DefaultLayerNodeUICtrl');


/**
 * @type {string}
 */
plugin.places.ui.PlacesNodeUITemplate = '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
      '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.addFolder()">' +
        '<i class="fa fa-folder fa-fw c-glyph" title="Create a new folder"></i></span>' +
      '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.addPlace()">' +
        '<i class="fa fa-map-marker fa-fw c-glyph" title="Create a new place"></i></span>' +

      '<button ng-if="nodeUi.isRemovable()" type="button" class="close mx-1" ng-click="nodeUi.remove()" ' +
      'aria-label="Close"><span aria-hidden="true" title="Remove the layer">&times;</span></button>' +
    '</span>';


/**
 * The Places selected/highlighted node UI directive
 * @return {angular.Directive}
 */
plugin.places.ui.placesNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: plugin.places.ui.PlacesNodeUITemplate,
    controller: plugin.places.ui.PlacesNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('placesnodeui', [plugin.places.ui.placesNodeUIDirective]);



/**
 * Controller for the Places selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.node.DefaultLayerNodeUICtrl}
 * @constructor
 * @ngInject
 */
plugin.places.ui.PlacesNodeUICtrl = function($scope, $element) {
  plugin.places.ui.PlacesNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.places.ui.PlacesNodeUICtrl, os.ui.node.DefaultLayerNodeUICtrl);


/**
 * Add a new folder.
 */
plugin.places.ui.PlacesNodeUICtrl.prototype.addFolder = function() {
  var node = /** @type {plugin.file.kml.ui.KMLLayerNode} */ (this.scope['item']);
  if (node) {
    var rootNode = plugin.places.getPlacesRoot(node);
    if (rootNode) {
      plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
        'parent': rootNode
      }));
    }
  }
};
goog.exportProperty(
    plugin.places.ui.PlacesNodeUICtrl.prototype,
    'addFolder',
    plugin.places.ui.PlacesNodeUICtrl.prototype.addFolder);


/**
 * Add a new place.
 */
plugin.places.ui.PlacesNodeUICtrl.prototype.addPlace = function() {
  var node = /** @type {plugin.file.kml.ui.KMLLayerNode} */ (this.scope['item']);
  if (node) {
    var rootNode = plugin.places.getPlacesRoot(node);
    if (rootNode) {
      plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
        'parent': rootNode
      }));
    }
  }
};
goog.exportProperty(
    plugin.places.ui.PlacesNodeUICtrl.prototype,
    'addPlace',
    plugin.places.ui.PlacesNodeUICtrl.prototype.addPlace);


/**
 * If the node can be edited.
 * @return {boolean}
 * @export
 */
plugin.places.ui.PlacesNodeUICtrl.prototype.canEdit = function() {
  var node = /** @type {plugin.file.kml.ui.KMLLayerNode} */ (this.scope['item']);
  return node ? node.isEditable() : false;
};


/**
 * @inheritDoc
 * @export
 */
plugin.places.ui.PlacesNodeUICtrl.prototype.remove = function() {
  plugin.places.PlacesManager.getInstance().removeLayer();
};
