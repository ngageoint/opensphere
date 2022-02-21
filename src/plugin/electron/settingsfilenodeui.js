goog.declareModuleId('plugin.electron.SettingsFileNodeUI');

import * as Dispatcher from '../../os/dispatcher.js';
import Module from '../../os/ui/module.js';
import AbstractNodeUICtrl from '../../os/ui/slick/abstractnodeui.js';
import {launchConfirm} from '../../os/ui/window/confirm.js';
import {launchConfirmText} from '../../os/ui/window/confirmtext.js';
import {EventType} from './electron.js';

/**
 * The settingsfilenodeui directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  template: `
<span class="flex-shrink-0 px-2" ng-if="ctrl.show()">
  <span ng-click="ctrl.edit()" ng-if="ctrl.canEdit()">
    <i class="fas fa-pencil-alt fa-fw c-glyph" title="Edit the settings file label"></i>
  </span>
  <span ng-click="ctrl.remove()" ng-if="ctrl.canRemove()">
    <i class="far fa-trash-alt fa-fw c-glyph" title="Remove the settings file from the application"></i>
  </span>
</span>`,
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'settingsfilenodeui';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the settingsfilenodeui directive.
 * @unrestricted
 */
export class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The settings file node.
     * @type {SettingsFileNode}
     * @protected
     */
    this.node = /** @type {SettingsFileNode} */ ($scope['item']);
  }

  /**
   * If the file can be edited.
   * @return {boolean}
   * @export
   */
  canEdit() {
    return !!this.node && !this.node.isDefault();
  }

  /**
   * If the file can be removed.
   * @return {boolean}
   * @export
   */
  canRemove() {
    return !!this.node && !this.node.isDefault();
  }

  /**
   * Edit the settings file.
   * @export
   */
  edit() {
    const file = this.node.getFile();
    launchConfirmText({
      confirm: (label) => {
        if (label !== file.label) {
          file.label = label;

          ElectronOS.updateUserSettings(file).then(() => {
            Dispatcher.getInstance().dispatchEvent(EventType.UPDATE_SETTINGS);
          });
        }
      },
      defaultValue: file.label,
      prompt: 'Please choose a new label for the settings file:',
      select: true,
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        icon: 'fas fa-cogs',
        label: 'Choose Label'
      })
    });
  }

  /**
   * Remove the settings file.
   * @export
   */
  remove() {
    const prompt = `Are you sure you want to remove <strong>${this.node.getLabel()}</strong> from the application?`;
    launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: () => {
        ElectronOS.removeUserSettings(this.node.getFile()).then(() => {
          Dispatcher.getInstance().dispatchEvent(EventType.UPDATE_SETTINGS);
        });
      },
      prompt,
      yesText: 'Remove',
      yesButtonClass: 'btn-danger',
      yesIcon: 'far fa-trash-alt',
      windowOptions: {
        icon: 'far fa-trash-alt',
        label: 'Remove Settings File',
        width: 350
      }
    }));
  }
}
