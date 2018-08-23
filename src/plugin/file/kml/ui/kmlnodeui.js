goog.provide('plugin.file.kml.ui.KMLNodeUICtrl');
goog.provide('plugin.file.kml.ui.kmlNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.AbstractNodeUICtrl');
goog.require('plugin.file.kml.cmd.KMLNodeRemove');


/**
 * The node UI for KML tree nodes
 * @return {angular.Directive}
 */
plugin.file.kml.ui.kmlNodeUIDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
        '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addFolder()">' +
          '<i class="fa fa-folder fa-fw c-glyph" title="Create a new folder"></i></span>' +
        '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addPlace()">' +
          '<i class="fa fa-map-marker fa-fw c-glyph" title="Create a new place"></i></span>' +
        '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.edit()">' +
          '<i class="fa fa-pencil fa-fw c-glyph" ' +
          'title="Edit the {{nodeUi.isFolder() ? \'folder\' : \'place\'}}"></i></span>' +

        '<button ng-if="nodeUi.canRemove()" type="button" class="close mx-1" ng-click="nodeUi.tryRemove()" ' +
          'aria-label="Close"><span aria-hidden="true" ' +
          'title="Remove the {{nodeUi.isFolder() ? \'folder\' : \'place\'}}">&times;</span></button>' +

        '</span>',
    controller: plugin.file.kml.ui.KMLNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the Angular module
 */
os.ui.Module.directive('kmlnodeui', [plugin.file.kml.ui.kmlNodeUIDirective]);



/**
 * Controller for KML tree node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
plugin.file.kml.ui.KMLNodeUICtrl = function($scope, $element) {
  plugin.file.kml.ui.KMLNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.file.kml.ui.KMLNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * If the node is a folder.
 * @return {boolean}
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.isFolder = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.isFolder();
};


/**
 * Add a new folder.
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.addFolder = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  if (node) {
    plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
      'parent': node
    }));
  }
};


/**
 * Add a new place.
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.addPlace = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  if (node) {
    plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
      'parent': node
    }));
  }
};


/**
 * If the node can be edited.
 * @return {boolean}
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.canAddChildren = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.canAddChildren;
};


/**
 * If the node can be edited.
 * @return {boolean}
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.canEdit = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.editable;
};


/**
 * If the node can be removed from the tree.
 * @return {boolean}
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.canRemove = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.removable;
};


/**
 * Prompt the user to remove the node from the tree.
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.tryRemove = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  if (node) {
    if (node.hasChildren()) {
      var label = node.getLabel();
      var prompt = 'Are you sure you want to remove <strong>' + label + '</strong> from the tree? This will also ' +
          'remove all descendants.';

      os.ui.window.launchConfirm(/** @type {!osx.window.ConfirmOptions} */ ({
        confirm: this.removeNodeInternal.bind(this, node),
        prompt: prompt,

        windowOptions: /** @type {!osx.window.WindowOptions} */ ({
          icon: 'fa fa-trash-o',
          label: 'Remove ' + label
        })
      }));
    } else {
      this.removeNodeInternal(node);
    }
  }
};


/**
 * Removes the node from the tree.
 * @param {!plugin.file.kml.ui.KMLNode} node The node
 * @protected
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.removeNodeInternal = function(node) {
  var cmd = new plugin.file.kml.cmd.KMLNodeRemove(node);
  os.commandStack.addCommand(cmd);
};


/**
 * Edits the node title.
 * @export
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.edit = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  if (node) {
    if (node.isFolder()) {
      plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
        'node': node
      }));
    } else {
      var feature = node.getFeature();
      plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
        'feature': feature,
        'node': node
      }));
    }
  }
};
