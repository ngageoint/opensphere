goog.declareModuleId('plugin.file.kml.ui.KMLNodeUI');

import * as annotation from '../../../../os/annotation/annotation.js';
import CommandProcessor from '../../../../os/command/commandprocessor.js';
import PropertyChangeEvent from '../../../../os/events/propertychangeevent.js';
import * as osObject from '../../../../os/object/object.js';
import Module from '../../../../os/ui/module.js';
import AbstractNodeUICtrl from '../../../../os/ui/slick/abstractnodeui.js';
import * as ConfirmUI from '../../../../os/ui/window/confirm.js';
import KMLNodeRemove from '../cmd/kmlnoderemovecmd.js';
import {createOrEditFolder, createOrEditPlace} from './kmlui.js';


/**
 * The node UI for KML tree nodes
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,

  template: '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
      '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addFolder()">' +
          '<i class="fa fa-folder-plus fa-fw c-glyph" title="Create a new folder"></i></span>' +
      '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addPlace()">' +
          '<i class="fa fa-map-marker fa-fw c-glyph" title="Create a new place"></i></span>' +
      '<span ng-if="nodeUi.canAddChildren()" ng-click="nodeUi.addPlace(true)">' +
        '<i class="fa fa-comment fa-fw c-glyph" title="Create a new place with a text box"></i>' +
      '</span>' +
      '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.edit()">' +
          '<i class="fa fa-pencil fa-fw c-glyph" ' +
              'title="Edit the {{nodeUi.isFolder() ? \'folder\' : \'place\'}}"></i></span>' +
      '<span ng-if="!nodeUi.isFolder() && nodeUi.hasAnnotation()" ng-click="nodeUi.removeAnnotation()">' +
          '<i class="fa fa-comment fa-fw c-glyph" title="Hide text box"></i></span>' +
      '<span ng-if="!nodeUi.isFolder() && !nodeUi.hasAnnotation()" ng-click="nodeUi.showAnnotation()">' +
          '<i class="fa fa-comment-o fa-fw c-glyph" title="Show text box"></i></span>' +

      '<span ng-if="nodeUi.canRemove()" ng-click="nodeUi.tryRemove()">' +
      '<i class="fa fa-times fa-fw c-glyph" ' +
          'title="Remove the {{nodeUi.isFolder() ? \'folder\' : \'place\'}}"></i></span>' +

      '</span>',

  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'kmlnodeui';


/**
 * Add the directive to the Angular module
 */
Module.directive('kmlnodeui', [directive]);



/**
 * Controller for KML tree node UI
 * @unrestricted
 */
export class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * If the node is a folder.
   *
   * @return {boolean}
   * @export
   */
  isFolder() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    return node != null && node.isFolder();
  }

  /**
   * Add a new folder.
   *
   * @export
   */
  addFolder() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      createOrEditFolder(/** @type {!FolderOptions} */ ({
        'parent': node
      }));
    }
  }

  /**
   * Add a new place.
   *
   * @param {boolean=} opt_annotation Whether the place is an annotation.
   * @export
   */
  addPlace(opt_annotation) {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      createOrEditPlace(/** @type {!FolderOptions} */ ({
        'parent': node,
        'annotation': opt_annotation
      }));
    }
  }

  /**
   * If the node can be edited.
   *
   * @return {boolean}
   * @export
   */
  canAddChildren() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    return node != null && node.canAddChildren;
  }

  /**
   * If the node can be edited.
   *
   * @return {boolean}
   * @export
   */
  canEdit() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    return node != null && node.editable;
  }

  /**
   * If the node can be removed from the tree.
   *
   * @return {boolean}
   * @export
   */
  canRemove() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    return node != null && node.removable;
  }

  /**
   * Prompt the user to remove the node from the tree.
   *
   * @export
   */
  tryRemove() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      if (node.hasChildren()) {
        var label = node.getLabel();
        var prompt = 'Are you sure you want to remove <strong>' + label + '</strong> from the tree? This will also ' +
            'remove all descendants.';

        ConfirmUI.launchConfirm(/** @type {!osx.window.ConfirmOptions} */ ({
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
  }

  /**
   * Removes the node from the tree.
   *
   * @param {!KMLNode} node The node
   * @protected
   */
  removeNodeInternal(node) {
    var cmd = new KMLNodeRemove(node);
    CommandProcessor.getInstance().addCommand(cmd);
  }

  /**
   * Edits the node title.
   *
   * @export
   */
  edit() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      if (node.isFolder()) {
        createOrEditFolder(/** @type {!FolderOptions} */ ({
          'node': node
        }));
      } else {
        var feature = node.getFeature();
        createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
          'feature': feature,
          'node': node
        }));
      }
    }
  }

  /**
   * If there is an annotation or not
   *
   * @return {boolean}
   * @export
   */
  hasAnnotation() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      var feature = node.getFeature();
      if (feature) {
        var options = /** @type {osx.annotation.Options|undefined} */ (feature.get(annotation.OPTIONS_FIELD));
        return options != null && options.show;
      }
    }
    return false;
  }

  /**
   * Removes annotation
   *
   * @export
   */
  removeAnnotation() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      var feature = node.getFeature();
      if (feature) {
        node.clearAnnotations();

        var options = /** @type {osx.annotation.Options|undefined} */ (feature.get(annotation.OPTIONS_FIELD));
        if (options) {
          options.show = false;
          node.dispatchEvent(new PropertyChangeEvent('icons'));
          node.dispatchEvent(new PropertyChangeEvent(annotation.EventType.CHANGE));
        }
      }
    }
  }

  /**
   * Shows annotation
   *
   * @export
   */
  showAnnotation() {
    var node = /** @type {KMLNode} */ (this.scope['item']);
    if (node) {
      var feature = node.getFeature();
      if (feature) {
        var options = /** @type {osx.annotation.Options|undefined} */ (feature.get(annotation.OPTIONS_FIELD));
        if (!options) {
          options = osObject.unsafeClone(annotation.DEFAULT_OPTIONS);
          feature.set(annotation.OPTIONS_FIELD, options);
        }

        options.show = true;

        node.loadAnnotation();
        node.dispatchEvent(new PropertyChangeEvent('icons'));
        node.dispatchEvent(new PropertyChangeEvent(annotation.EventType.CHANGE));
      }
    }
  }
}
