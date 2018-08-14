goog.provide('plugin.track.ui.TrackNodeUICtrl');
goog.provide('plugin.track.ui.trackNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.node.DefaultLayerNodeUICtrl');
goog.require('plugin.file.kml.ui');


/**
 * @type {string}
 */
plugin.track.ui.TrackNodeUITemplate = '<span class="glyphs pull-right slick-node-ui" ng-if="nodeUi.show()">' +
        '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.addFolder()">' +
            '<i class="fa fa-folder fa-fw glyph" title="Create a new folder"></i></span>' +
        '<span ng-if="nodeUi.isRemovable()" ng-click="nodeUi.remove()">' +
            '<i class="fa fa-times fa-fw glyph glyph-remove" title="Remove the layer and all saved tracks"></i>' +
        '</span>' +
    '</span>';


/**
 * The tracks selected/highlighted node UI directive
 * @return {angular.Directive}
 */
plugin.track.ui.trackNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: plugin.track.ui.TrackNodeUITemplate,
    controller: plugin.track.ui.TrackNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('tracknodeui', [plugin.track.ui.trackNodeUIDirective]);



/**
 * Controller for the tracks selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.node.DefaultLayerNodeUICtrl}
 * @constructor
 * @ngInject
 */
plugin.track.ui.TrackNodeUICtrl = function($scope, $element) {
  plugin.track.ui.TrackNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.track.ui.TrackNodeUICtrl, os.ui.node.DefaultLayerNodeUICtrl);


/**
 * Add a new folder.
 */
plugin.track.ui.TrackNodeUICtrl.prototype.addFolder = function() {
  var node = /** @type {plugin.file.kml.ui.KMLLayerNode} */ (this.scope['item']);
  if (node) {
    var rootNode = plugin.file.kml.ui.getKMLRoot(node);
    if (rootNode) {
      plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
        'parent': rootNode
      }));
    }
  }
};
goog.exportProperty(
    plugin.track.ui.TrackNodeUICtrl.prototype,
    'addFolder',
    plugin.track.ui.TrackNodeUICtrl.prototype.addFolder);


/**
 * If the node can be edited.
 * @return {boolean}
 */
plugin.track.ui.TrackNodeUICtrl.prototype.canEdit = function() {
  var node = /** @type {plugin.file.kml.ui.KMLLayerNode} */ (this.scope['item']);
  return node != null && node.isEditable();
};
goog.exportProperty(
    plugin.track.ui.TrackNodeUICtrl.prototype,
    'canEdit',
    plugin.track.ui.TrackNodeUICtrl.prototype.canEdit);
