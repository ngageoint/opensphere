goog.module('os.ui.node.FolderNodeUI');
goog.module.declareLegacyNamespace();

const AbstractNodeUICtrl = goog.require('os.ui.slick.AbstractNodeUICtrl');
const FolderManager = goog.require('os.layer.FolderManager');
const Module = goog.require('os.ui.Module');
const {launchRemoveFolder, createOrEditFolder} = goog.require('os.layer.folder');

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
      <span ng-click="nodeUi.tryRemove()"><i class="fa fa-times fa-fw c-glyph" title="Unfolder"></i></span>
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
      const options = {
        name: 'New Folder',
        type: 'folder',
        id: goog.string.getRandomString(),
        parentId: node.getId(),
        children: []
      };

      createOrEditFolder(options, this.onCreateFolder.bind(this, options));
    }
  }

  /**
   * Handles creating a new folder.
   * @param {!osx.layer.FolderOptions} options The folder options.
   * @param {string} name The chosen folder name.
   */
  onCreateFolder(options, name) {
    options.name = name;
    FolderManager.getInstance().createFolder(options);
  }

  /**
   * Prompt the user to remove the node from the tree.
   * @export
   */
  tryRemove() {
    var node = /** @type {FolderNode} */ (this.scope['item']);
    if (node) {
      if (node.hasChildren()) {
        launchRemoveFolder(node.getOptions(), this.removeNodeInternal.bind(this, node));
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
      const options = node.getOptions();
      createOrEditFolder(options, this.onEditFolder.bind(this, options), true);
    }
  }

  /**
   * Handles editing a folder.
   * @param {osx.layer.FolderOptions} options The folder options.
   * @param {string} name The chosen folder name.
   */
  onEditFolder(options, name) {
    const fm = FolderManager.getInstance();
    fm.removeFolder(options.id);
    options.name = name;
    fm.createFolder(options);
  }
}


exports = {
  Controller,
  directive
};
