goog.declareModuleId('os.ui.data.DescriptorNodeUI');

import CommandProcessor from '../../command/commandprocessor.js';
import BaseDescriptor from '../../data/basedescriptor.js';
import DataManager from '../../data/datamanager.js';
import Module from '../module.js';
import AbstractNodeUICtrl from '../slick/abstractnodeui.js';
import * as ConfirmUI from '../window/confirm.js';
import DescriptorProvider from './descriptorprovider.js';

const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: DescriptorNode} = goog.requireType('os.ui.data.DescriptorNode');


/**
 * Generic node UI for descriptors.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span ng-if="nodeUi.show()" class="flex-shrink-0" ng-click="nodeUi.tryRemove()">' +
    '<i class="fa fa-trash-o fa-fw c-glyph" title="Remove this layer from the application"></i>' +
  '</span>',
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'descriptornodeui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for descriptor node UI.
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
   * Prompt the user to remove the descriptor from the application.
   * @export
   */
  tryRemove() {
    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: this.remove.bind(this),
      cancel: () => {},
      prompt: this.getRemoveWindowText(),
      yesText: 'Remove',
      yesIcon: 'fa fa-trash-o',
      yesButtonClass: 'btn-danger',
      windowOptions: this.getRemoveWindowOptions()
    }));
  }

  /**
   * Get the window options for the remove prompt.
   * @return {Object<string, string>} The window options.
   * @protected
   */
  getRemoveWindowOptions() {
    var title = '';
    var descriptor = this.getDescriptor();
    if (descriptor) {
      title = descriptor.getTitle();
    }

    return {
      'label': 'Remove ' + title + '?',
      'icon': 'fa fa-trash-o',
      'headerClass': 'bg-danger u-bg-danger-text',
      'x': 'center',
      'y': 'center',
      'width': '325',
      'height': 'auto',
      'modal': 'true'
    };
  }

  /**
   * Get the text to display in the remove prompt.
   * @return {!string} The text.
   * @protected
   */
  getRemoveWindowText() {
    return 'Are you sure you want to remove this layer from the application? ' +
        '<b>This action cannot be undone</b>, and will clear the application history.';
  }

  /**
   * Get the descriptor for the node.
   * @return {IDataDescriptor} The descriptor.
   * @protected
   */
  getDescriptor() {
    // the node should be on the scope as 'item'
    var node = /** @type {DescriptorNode} */ (this.scope['item']);
    return node.getDescriptor();
  }

  /**
   * Remove the descriptor.
   * @protected
   */
  remove() {
    this.removeDescriptor();
  }

  /**
   * Permanently remove the descriptor and associated data from the application.
   * @protected
   */
  removeDescriptor() {
    var descriptor = this.getDescriptor();
    var dm = DataManager.getInstance();
    if (descriptor && descriptor instanceof BaseDescriptor) {
      // remove the descriptor from the data manager
      dm.removeDescriptor(descriptor);

      var provider = /** @type {DescriptorProvider} */ (dm.getProvider(descriptor.getId()) ||
          dm.getProviderByLabel(descriptor.getProvider() || ''));
      if (provider && provider instanceof DescriptorProvider) {
        // remove the descriptor from the provider
        provider.removeDescriptor(descriptor, true);
      }

      descriptor.dispose();

      // restoring descriptors is currently not supported, so clear the application stack to avoid conflicts
      CommandProcessor.getInstance().clearHistory();
    }
  }
}
