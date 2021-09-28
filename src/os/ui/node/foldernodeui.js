goog.declareModuleId('os.ui.node.FolderNodeUI');

import {launchRemoveFolder, createOrEditFolder} from '../../layer/folder.js';
import FolderManager from '../../layer/foldermanager.js';
import Module from '../module.js';
import AbstractNodeUICtrl from '../slick/abstractnodeui.js';

const {getRandomString} = goog.require('goog.string');

const {default: FolderNode} = goog.requireType('os.data.FolderNode');


/**
 * The foldernodeui directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  template: `<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">
      <span ng-click="nodeUi.addFolder()">
        <i class="fa fa-folder-plus fa-fw c-glyph" title="Create a new folder"></i>
      </span>
      <span ng-click="nodeUi.edit()"><i class="fa fa-pencil fa-fw c-glyph" title="Rename the folder"></i></span>
      <span ng-click="nodeUi.tryRemove()"><i class="fa fa-times fa-fw c-glyph" title="Unfolder"></i></span>
      </span>`.trim(),
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'foldernodeui';


/**
 * Add the directive to the Angular module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the folder node UI.
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
   * Add a new folder.
   * @export
   */
  addFolder() {
    var node = /** @type {FolderNode} */ (this.scope['item']);
    if (node) {
      const options = {
        name: 'New Folder',
        type: 'folder',
        id: getRandomString(),
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
