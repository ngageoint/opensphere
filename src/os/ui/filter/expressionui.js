goog.module('os.ui.filter.ExpressionUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.filter.op.OPUISwitchUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {OPERATIONS} = goog.require('os.ui.filter');
const {findColumn} = goog.require('os.ui.slick.column');

const Expression = goog.requireType('os.ui.filter.Expression');
const Op = goog.requireType('os.ui.filter.op.Op');


/**
 * The expression directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'expr': '=',
    'columns': '='
  },
  templateUrl: ROOT + 'views/filter/expression.html',
  controller: Controller,
  controllerAs: 'exprCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'expression';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the expression directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    this.scope['ops'] = OPERATIONS;

    // filter out any column types that we can't handle
    if ($scope['columns']) {
      $scope['columns'] = $scope['columns'].filter(this.filterColumns_, this);
    }

    var expr = /** @type {Expression} */ ($scope['expr']);

    if (expr.columnName && !expr['column']) {
      expr['column'] = findColumn(this.scope['columns'], expr.columnName);
    }

    expr['column'] = expr['column'] || this.scope['columns'][0];
    expr['op'] = expr['op'] || OPERATIONS[0];

    $scope.$watch('expr.column', this.onColChange_.bind(this));
    $scope.$watch('expr.op', this.runValidation.bind(this));

    this.onColChange_(expr['column'], null);
  }

  /**
   * Filters columns that cannot be handled by the filter builder
   *
   * @param {*} col
   * @param {number} c
   * @param {Array} arr
   * @return {boolean} Whether or not the column is supported
   * @private
   */
  filterColumns_(col, c, arr) {
    // see if there are any ops that support this column
    // Currently, we do not support date columns in filter expressions, see THIN-7383
    if (!(/datetime/i).test(col['type'])) {
      for (var i = 0, n = this.scope['ops'].length; i < n; i++) {
        var op = /** @type {Op} */ (this.scope['ops'][i]);

        if (op.isSupported(col['type'])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handles changes to column
   *
   * @param {*} newValue
   * @param {*} oldValue
   * @private
   */
  onColChange_(newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    // filter ops
    this.scope['ops'] = OPERATIONS.filter(this.filterOps_, this);

    var expr = /** @type {Expression} */ (this.scope['expr']);
    expr['op'] = this.scope['ops'].indexOf(expr['op']) > -1 ? expr['op'] : this.scope['ops'][0];

    this.runValidation();
  }

  /**
   * Re-runs the form validation
   *
   * @protected
   */
  runValidation() {
    try {
      var formItem = this.scope['exprForm']['literal'];
      if (formItem.$viewValue) {
        formItem.$setViewValue(formItem.$viewValue);
        formItem.$$parseAndValidate();
      }
    } catch (e) {
    }
  }

  /**
   * Filters ops by type
   *
   * @param {Op} op
   * @return {boolean}
   * @private
   */
  filterOps_(op) {
    if (this.scope && this.scope['expr'] && this.scope['expr']['column']) {
      return op.isSupported(this.scope['expr']['column']['type']);
    }

    return false;
  }

  /**
   * Gets the UI for the given item
   *
   * @param {Op} op
   * @return {?string}
   * @export
   */
  getUi(op) {
    return op ? op.getUi() : null;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
