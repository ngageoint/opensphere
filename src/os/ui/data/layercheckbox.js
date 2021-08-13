goog.module('os.ui.data.LayerCheckboxUI');

const LayerSyncDescriptor = goog.require('os.data.LayerSyncDescriptor');
const TriState = goog.require('os.structs.TriState');
const Module = goog.require('os.ui.Module');
const {
  Controller: TriStateCheckboxCtrl,
  directive: triStateCheckboxDirective
} = goog.require('os.ui.TriStateCheckboxUI');
const DescriptorNode = goog.require('os.ui.data.DescriptorNode');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');

const ITreeNode = goog.requireType('os.structs.ITreeNode');
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
 * Reducer function to count the number of layers under a node.
 * @param {number} count The current count.
 * @param {ITreeNode} child The child node.
 * @return {number}
 */
const countLayerChildren = (count, child) => {
  if (child instanceof DescriptorNode) {
    const descriptor = child.getDescriptor();

    if (descriptor instanceof LayerSyncDescriptor) {
      const layers = descriptor.getOptions();

      if (layers) {
        // LayerSyncDescriptor can be a parent to multiple layers, so count all of them
        count += layers.length;
      }
    } else {
      count++;
    }
  }

  const grandChildren = child.getChildren();
  if (grandChildren) {
    count += grandChildren.reduce(countLayerChildren, count);
  }

  return count;
};

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
          let count = 0;
          if (children) {
            count = children.reduce(countLayerChildren, 0);
          }

          if (count > this.minCount) {
            // we're over the minimum, so confirm first
            ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
              confirm: this.toggleInternal.bind(this, TriState.ON),
              prompt: `You are about to enable ${count} layers. Enabling too many layers at once can cause
                  performance issues. Are you sure?`.trim(),
              yesText: 'OK',
              noText: 'Cancel',
              windowOptions: {
                'label': `Enabling ${count} Layers`,
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
