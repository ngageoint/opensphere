goog.module('os.ui.im.action.FilterActionNodeUI');
goog.module.declareLegacyNamespace();

const ImportActionEventType = goog.require('os.im.action.ImportActionEventType');
const Metrics = goog.require('os.metrics.Metrics');
const Module = goog.require('os.ui.Module');
const FilterNodeUICtrl = goog.require('os.ui.filter.ui.FilterNodeUICtrl');
const filterNodeUIDirective = goog.require('os.ui.filter.ui.filterNodeUIDirective');


/**
 * The selected/highlighted node UI directive for filter actions.
 *
 * @return {angular.Directive}
 */
const directive = () => {
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
const directiveTag = 'filteractionnodeui';


/**
 * Add the directive to the Angular module.
 */
Module.directive('filteractionnodeui', [directive]);



/**
 * Controller for selected/highlighted node UI.
 * @unrestricted
 */
class Controller extends FilterNodeUICtrl {
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
    var node = /** @type {os.ui.im.action.FilterActionNode} */ (this.scope['item']);
    var entry = node.getEntry();

    if (entry) {
      var parentIndex = os.structs.getIndexInParent(node);
      this.scope.$emit(ImportActionEventType.COPY_ENTRY, entry, parentIndex);
      Metrics.getInstance().updateMetric(os.im.action.Metrics.COPY, 1);
    }
  }

  /**
   * Edit the filter action.
   *
   * @override
   * @export
   */
  edit() {
    var entry = /** @type {os.ui.im.action.FilterActionNode} */ (this.scope['item']).getEntry();
    if (entry) {
      this.scope.$emit(ImportActionEventType.EDIT_ENTRY, entry);
      Metrics.getInstance().updateMetric(os.im.action.Metrics.EDIT, 1);
    }
  }

  /**
   * Remove the filter action.
   *
   * @override
   * @export
   */
  remove() {
    var entry = /** @type {os.ui.im.action.FilterActionNode} */ (this.scope['item']).getEntry();
    if (entry && !entry.isDefault()) {
      this.scope.$emit(ImportActionEventType.REMOVE_ENTRY, entry);
      Metrics.getInstance().updateMetric(os.im.action.Metrics.REMOVE, 1);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
