goog.declareModuleId('os.ui.TriStateCheckboxUI');

import TriState from '../structs/tristate.js';
import Module from './module.js';
import {apply} from './ui.js';

const {default: TriStateTreeNode} = goog.requireType('os.structs.TriStateTreeNode');


/**
 * The slick tree directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span ng-class="chkClass + \' \' + chkClass + \'-\' + item.state"' +
      'ng-click="checkCtrl.toggle($event)" ng-dblclick="checkCtrl.onDblClick($event)" title="{{chkTooltip}}">' +
      '<label></label></span>',
  controller: Controller,
  controllerAs: 'checkCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'tristatecheckbox';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for tri-state checkbox
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
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     */
    this.element = $element;

    var item = /** @type {TriStateTreeNode} */ (this.scope['item']);
    if (this.getDisabled(item)) {
      $element.addClass('disabled');
    }

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references
   *
   * @private
   */
  destroy_() {
    this.scope = null;
    this.element = null;
  }

  /**
   * Toggles the state on the scope
   *
   * @param {MouseEvent} e The event
   * @export
   */
  toggle(e) {
    if (this.scope) {
      var item = /** @type {TriStateTreeNode} */ (this.scope['item']);
      if (!this.getDisabled(item)) {
        // on/both should toggle to the off state
        item.setState(item.getState() == TriState.OFF ?
          TriState.ON : TriState.OFF);

        this.notifyDirty();
      }

      e.stopPropagation();
    }
  }

  /**
   * Toggles the state on the scope
   *
   * @param {MouseEvent} e The event
   * @export
   */
  onDblClick(e) {
    if (!this.element.hasClass('disabled')) {
      // prevent double click from propagating further if the checkbox is enabled. clicks should only toggle the checkbox.
      e.stopPropagation();
    }
  }

  /**
   * Gets whether the checkbox is enabled.
   *
   * @param {?TriStateTreeNode} item
   * @return {boolean}
   */
  getDisabled(item) {
    if (item) {
      const disabled = item.getCheckboxDisabled();
      if (disabled != null) {
        // if disabled is explicitly true or false, treat it as an override
        return disabled;
      }

      // if disabled is null, use the tree-level flag
      return this.scope['disableFolders'] && item.hasChildren();
    }

    return false;
  }

  /**
   * Fire a dirty event on the scope to update parents.
   */
  notifyDirty() {
    if (this.scope) {
      this.scope.$emit('dirty');
      apply(this.scope);
    }
  }
}
