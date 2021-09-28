goog.declareModuleId('os.ui.im.action.FilterActionNodeUI');

import {Metrics as ActionMetrics} from '../../../im/action/importaction.js';
import ImportActionEventType from '../../../im/action/importactioneventtype.js';
import Metrics from '../../../metrics/metrics.js';
import {getIndexInParent} from '../../../structs/structs.js';
import {directive as filterNodeUIDirective, Controller as FilterNodeUICtrl} from '../../filter/ui/filternodeui.js';
import Module from '../../module.js';

const {default: FilterActionNode} = goog.requireType('os.ui.im.action.FilterActionNode');


/**
 * The selected/highlighted node UI directive for filter actions.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var directive = filterNodeUIDirective();
  directive.controller = Controller;
  directive.template = '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
      '<span ng-click="nodeUi.copy()">' +
      '<i class="fa fa-copy fa-fw c-glyph" title="Copy the action"></i></span>' +
      '<span ng-click="nodeUi.edit()">' +
      '<i class="fa fa-pencil fa-fw c-glyph" title="Edit the action"></i></span>' +
      '<span ng-click="nodeUi.remove()" ng-if="!nodeUi.isDefault()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the action"></i></span>' +
      '</span>';
  return directive;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filteractionnodeui';


/**
 * Add the directive to the Angular module.
 */
Module.directive('filteractionnodeui', [directive]);



/**
 * Controller for selected/highlighted node UI.
 * @unrestricted
 */
export class Controller extends FilterNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * Copy the filter action.
   *
   * @override
   * @export
   */
  copy() {
    var node = /** @type {FilterActionNode} */ (this.scope['item']);
    var entry = node.getEntry();

    if (entry) {
      var parentIndex = getIndexInParent(node);
      this.scope.$emit(ImportActionEventType.COPY_ENTRY, entry, parentIndex);
      Metrics.getInstance().updateMetric(ActionMetrics.COPY, 1);
    }
  }

  /**
   * Edit the filter action.
   *
   * @override
   * @export
   */
  edit() {
    var entry = /** @type {FilterActionNode} */ (this.scope['item']).getEntry();
    if (entry) {
      this.scope.$emit(ImportActionEventType.EDIT_ENTRY, entry);
      Metrics.getInstance().updateMetric(ActionMetrics.EDIT, 1);
    }
  }

  /**
   * Remove the filter action.
   *
   * @override
   * @export
   */
  remove() {
    var entry = /** @type {FilterActionNode} */ (this.scope['item']).getEntry();
    if (entry && !entry.isDefault()) {
      this.scope.$emit(ImportActionEventType.REMOVE_ENTRY, entry);
      Metrics.getInstance().updateMetric(ActionMetrics.REMOVE, 1);
    }
  }
}
