goog.module('os.ui.data.LayerCheckboxUI');

const ConfirmUI = goog.require('os.ui.window.ConfirmUI');
const Module = goog.require('os.ui.Module');
const TriState = goog.require('os.structs.TriState');
const TriStateCheckboxCtrl = goog.require('os.ui.TriStateCheckboxCtrl');
const triStateCheckboxDirective = goog.require('os.ui.triStateCheckboxDirective');

const TriStateTreeNode = goog.requireType('os.structs.TriStateTreeNode');


/**
 * Tristate checkbox extension for enabling layers.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const dir = triStateCheckboxDirective();
  dir.controller = Controller;
  return dir;
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'layercheckbox';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for the layer checkbox.
 * @unrestricted
 */
class Controller extends TriStateCheckboxCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The minimum count of layers before prompting the user.
     * @type {number}
     */
    this.minCount = $scope['minCount'] || 10;
  }

  /**
   * @inheritDoc
   */
  toggle(e) {
    if (this.scope) {
      const item = /** @type {TriStateTreeNode} */ (this.scope['item']);

      if (!this.getDisabled(item)) {
        const children = item.getChildren();
        const state = item.getState();

        if (state == TriState.OFF) {
          if (children && children.length > this.minCount) {
            // we're over the minimum, so confirm first
            ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
              confirm: this.toggleInternal.bind(this, TriState.ON),
              prompt: `You are about to enable ${children.length} layers. Enabling too many layers at once can cause 
                  performance issues. Are you sure?`.trim(),
              yesText: 'OK',
              noText: 'Cancel',
              windowOptions: {
                'label': `Enabling ${children.length} Layers`,
                'icon': 'fa fa-warning',
                'x': 'center',
                'y': 'center',
                'width': '335',
                'height': 'auto',
                'modal': 'true',
                'headerClass': 'bg-warning u-bg-warning-text'
              }
            }));
          } else {
            // under the minimum, just activate
            this.toggleInternal(TriState.ON);
          }
        } else {
          // turn it off
          this.toggleInternal(TriState.OFF);
        }
      }

      e.stopPropagation();
    }
  }

  /**
   * Toggles the item on or off.
   * @param {TriState} value The value to set.
   */
  toggleInternal(value) {
    const item = /** @type {TriStateTreeNode} */ (this.scope['item']);
    item.setState(value);
    this.notifyDirty();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
