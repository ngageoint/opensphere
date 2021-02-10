goog.module('os.ui.node.FolderNodeUI');
goog.module.declareLegacyNamespace();

const AbstractNodeUICtrl = goog.require('os.ui.slick.AbstractNodeUICtrl');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');
const FolderManager = goog.require('os.layer.FolderManager');
const Module = goog.require('os.ui.Module');

const FolderNode = goog.requireType('os.data.FolderNode');


/**
 * The foldernodeui directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  template: `<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">
      <span ng-click="nodeUi.addFolder()"><i class="fa fa-folder fa-fw c-glyph" title="Create a new folder"></i></span>
      <span ng-click="nodeUi.edit()"><i class="fa fa-pencil fa-fw c-glyph" title="Edit the folder"></i></span>
      <span ng-click="nodeUi.tryRemove()"><i class="fa fa-times fa-fw c-glyph" title="Remove the folder"></i></span>
      </span>`.trim(),
  controller: Controller,
  controllerAs: 'nodeUi'
});


/**
 * Add the directive to the Angular module
 */
Module.directive('foldernodeui', [directive]);


/**
 * Controller for the folder node UI.
 * @unrestricted
 */
class Controller extends AbstractNodeUICtrl {
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
   * Add a new folder.
   * @export
   */
  addFolder() {
    var node = /** @type {os.data.FolderNode} */ (this.scope['item']);
    if (node) {
      FolderManager.getInstance().createOrEditFolder(
          /** @type {!osx.layer.FolderOptions} */ ({id: goog.string.getRandomString()}), node.getId());
    }
  }

  /**
   * Prompt the user to remove the node from the tree.
   * @export
   */
  tryRemove() {
    var node = /** @type {FolderNode} */ (this.scope['item']);
    if (node) {
      // FolderManager.getInstance().tryRemove(node.getId());
      if (node.hasChildren()) {
        var label = node.getLabel();
        var prompt = 'Are you sure you want to remove the folder? This will remove all its descendants.';

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
   * @param {!FolderNode} node The node
   * @protected
   */
  removeNodeInternal(node) {
    FolderManager.getInstance().removeFolder(node.getId());
  }

  /**
   * Edits the folder title.
   * @export
   */
  edit() {
    var node = /** @type {FolderNode} */ (this.scope['item']);
    if (node) {
      const options = {
        id: node.getId(),
        name: node.getLabel() || 'New Folder'
      };
      FolderManager.getInstance().createOrEditFolder(options);
    }
  }
}


exports = {
  Controller,
  directive
};
