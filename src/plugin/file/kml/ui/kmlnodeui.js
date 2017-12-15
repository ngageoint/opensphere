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
    template: '<span class="glyphs pull-right slick-node-ui" ng-if="nodeUi.show()">' +
        '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addFolder()">' +
            '<i class="fa fa-folder fa-fw glyph" title="Create a new folder"></i></span>' +
        '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addPlace()">' +
            '<i class="fa fa-map-marker fa-fw glyph" title="Create a new place"></i></span>' +
        '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.edit()">' +
            '<i class="fa fa-pencil fa-fw glyph" ' +
            'title="Edit the {{nodeUi.isFolder() ? \'folder\' : \'place\'}}"></i></span>' +
        '<span ng-if="nodeUi.canRemove()" ng-click="nodeUi.tryRemove()">' +
            '<i class="fa fa-times fa-fw glyph glyph-remove" ' +
            'title="Remove the {{nodeUi.isFolder() ? \'folder\' : \'place\'}}"></i></span>' +
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
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.isFolder = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.isFolder();
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'isFolder',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.isFolder);


/**
 * Add a new folder.
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.addFolder = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  if (node) {
    plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
      'parent': node
    }));
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'addFolder',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.addFolder);


/**
 * Add a new place.
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.addPlace = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  if (node) {
    plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
      'parent': node
    }));
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'addPlace',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.addPlace);


/**
 * If the node can be edited.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.canAddChildren = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.canAddChildren;
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'canAddChildren',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.canAddChildren);


/**
 * If the node can be edited.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.canEdit = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.editable;
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'canEdit',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.canEdit);


/**
 * If the node can be removed from the tree.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLNodeUICtrl.prototype.canRemove = function() {
  var node = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['item']);
  return node != null && node.removable;
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'canRemove',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.canRemove);


/**
 * Prompt the user to remove the node from the tree.
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
          icon: 'fa fa-trash-o red-icon',
          label: 'Remove ' + label
        })
      }));
    } else {
      this.removeNodeInternal(node);
    }
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'tryRemove',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.tryRemove);


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
goog.exportProperty(
    plugin.file.kml.ui.KMLNodeUICtrl.prototype,
    'edit',
    plugin.file.kml.ui.KMLNodeUICtrl.prototype.edit);
