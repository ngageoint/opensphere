goog.declareModuleId('os.ui.column.mapping.ColumnMappingNodeUI');

import ColumnMappingManager from '../../../column/columnmappingmanager.js';
import Module from '../../module.js';
import * as ConfirmUI from '../../window/confirm.js';
import {launchColumnMappingWindow} from './columnmappingform.js';

const {default: ColumnMappingNode} = goog.requireType('os.ui.column.mapping.ColumnMappingNode');


/**
 * The selected/highlighted node UI directive for column mappings
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  template: '<div>' +
      '<span ng-click="nodeUi.edit()">' +
      '<i class="fa fa-pencil fa-fw c-glyph" title="Edit the column mapping"></i></span>' +
      '<span ng-click="nodeUi.tryRemove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the column mapping"></i></span>' +
      '</div>',
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'columnmappingnodeui';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI for column mappings
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;
  }

  /**
   * Prompt the user to remove the analytic from the application
   *
   * @export
   */
  tryRemove() {
    var cm = /** @type {ColumnMappingNode} */ (this.scope_['item']).getColumnMapping();
    var text = 'Are you sure you want to remove the <b>' + cm.getName() + '</b> column association from the ' +
        'application? <b>This action cannot be undone.</b>';

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: this.remove_.bind(this),
      prompt: text,
      yesText: 'Remove',
      yesIcon: 'fa fa-trash-o',
      yesButtonClass: 'btn-danger',
      windowOptions: {
        'label': 'Remove Column Association',
        'icon': 'fa fa-trash-o',
        'x': 'center',
        'y': 400,
        'width': 325,
        'height': 'auto',
        'modal': 'true',
        'headerClass': 'bg-danger u-bg-danger-text'
      }
    }));
  }

  /**
   * Removes the column mapping
   *
   * @private
   */
  remove_() {
    var cm = /** @type {ColumnMappingNode} */ (this.scope_['item']).getColumnMapping();
    ColumnMappingManager.getInstance().remove(cm);
  }

  /**
   * Edits the column mapping
   *
   * @export
   */
  edit() {
    var cm = /** @type {ColumnMappingNode} */ (this.scope_['item']).getColumnMapping();
    launchColumnMappingWindow(cm);
  }
}
