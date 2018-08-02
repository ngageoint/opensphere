goog.provide('os.ui.filter.Expression');
goog.provide('os.ui.filter.ExpressionCtrl');
goog.provide('os.ui.filter.expressionDirective');

goog.require('goog.dom');
goog.require('os.ui.Module');
goog.require('os.ui.filter');
goog.require('os.ui.filter.op.opUISwitchDirective');
goog.require('os.ui.slick.column');


/**
 * The expression directive
 * @return {angular.Directive}
 */
os.ui.filter.expressionDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'expr': '=',
      'columns': '='
    },
    templateUrl: os.ROOT + 'views/filter/expression.html',
    controller: os.ui.filter.ExpressionCtrl,
    controllerAs: 'exprCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('expression', [os.ui.filter.expressionDirective]);



/**
 * Expression object
 * @constructor
 */
os.ui.filter.Expression = function() {
  /**
   * @type {?string}
   */
  this.columnName = null;

  /**
   * @type {?Object}
   */
  this['column'] = null;

  /**
   * @type {?os.ui.filter.op.Op}
   */
  this['op'] = null;

  /**
   * @type {?string}
   */
  this['literal'] = null;
};


/**
 * @return {?string} the filter
 */
os.ui.filter.Expression.prototype.getFilter = function() {
  if (this['op']) {
    var columnName = this['column']['field'] || this['column']['name'];
    return /** @type {os.ui.filter.op.Op} */ (this['op']).getFilter(columnName, this['literal']);
  }

  return null;
};


/**
 * @param {?Node} value the filter
 */
os.ui.filter.Expression.prototype.setFilter = function(value) {
  if (value) {
    // set up the expression from the filter
    var el = angular.element(value);
    var ops = os.ui.filter.OPERATIONS;

    this['literal'] = '';

    for (var i = 0, n = ops.length; i < n; i++) {
      if (ops[i].matches(el)) {
        var op = ops[i];
        this.columnName = op.getColumn(el);
        this['literal'] = op.getLiteral(el);
        this['op'] = op;
        break;
      }
    }
  }
};


/**
 * @param {string|number} value
 * @return {boolean}
 */
os.ui.filter.Expression.prototype.validate = function(value) {
  if (this['column'] && this['op']) {
    var key = this['column']['type'];
    return this['op'].validate(value, key);
  }
  return false;
};


/**
 * Clones the expression.
 * @return {os.ui.filter.Expression} The literal
 */
os.ui.filter.Expression.prototype.clone = function() {
  var clone = new os.ui.filter.Expression();
  clone['column'] = this['column'];
  clone['op'] = this['op'];
  clone['literal'] = this['literal'];

  var filter = this.getFilter();
  if (filter) {
    try {
      clone.setFilter(goog.dom.getFirstElementChild($.parseXML(filter)));
    } catch (e) {}
  }

  return clone;
};



/**
 * Controller for the expression directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ExpressionCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  this.scope['ops'] = os.ui.filter.OPERATIONS;

  // filter out any column types that we can't handle
  if ($scope['columns']) {
    $scope['columns'] = $scope['columns'].filter(this.filterColumns_, this);
  }

  var expr = /** @type {os.ui.filter.Expression} */ ($scope['expr']);

  if (expr.columnName && !expr['column']) {
    expr['column'] = os.ui.slick.column.findColumn(this.scope['columns'], expr.columnName);
  }

  expr['column'] = expr['column'] || this.scope['columns'][0];
  expr['op'] = expr['op'] || os.ui.filter.OPERATIONS[0];

  $scope.$watch('expr.column', this.onColChange_.bind(this));
  $scope.$watch('expr.op', this.runValidation.bind(this));

  this.onColChange_(expr['column'], null);
};


/**
 * Filters columns that cannot be handled by the filter builder
 * @param {*} col
 * @param {number} c
 * @param {Array} arr
 * @return {boolean} Whether or not the column is supported
 * @private
 */
os.ui.filter.ExpressionCtrl.prototype.filterColumns_ = function(col, c, arr) {
  // see if there are any ops that support this column
  // Currently, we do not support date columns in filter expressions, see THIN-7383
  if (!(/datetime/i).test(col['type'])) {
    for (var i = 0, n = this.scope['ops'].length; i < n; i++) {
      var op = /** @type {os.ui.filter.op.Op} */ (this.scope['ops'][i]);

      if (op.isSupported(col['type'])) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Handles changes to column
 * @param {*} newValue
 * @param {*} oldValue
 * @private
 */
os.ui.filter.ExpressionCtrl.prototype.onColChange_ = function(newValue, oldValue) {
  if (newValue === oldValue) {
    return;
  }

  // filter ops
  this.scope['ops'] = os.ui.filter.OPERATIONS.filter(this.filterOps_, this);

  var expr = /** @type {os.ui.filter.Expression} */ (this.scope['expr']);
  expr['op'] = this.scope['ops'].indexOf(expr['op']) > -1 ? expr['op'] : this.scope['ops'][0];

  this.runValidation();
};


/**
 * Re-runs the form validation
 * @protected
 */
os.ui.filter.ExpressionCtrl.prototype.runValidation = function() {
  try {
    var formItem = this.scope['exprForm']['literal'];
    if (formItem.$viewValue) {
      formItem.$setViewValue(formItem.$viewValue);
      formItem.$$parseAndValidate();
    }
  } catch (e) {
  }
};


/**
 * Filters ops by type
 * @param {os.ui.filter.op.Op} op
 * @return {boolean}
 * @private
 */
os.ui.filter.ExpressionCtrl.prototype.filterOps_ = function(op) {
  if (this.scope && this.scope['expr'] && this.scope['expr']['column']) {
    return op.isSupported(this.scope['expr']['column']['type']);
  }

  return false;
};


/**
 * Gets the UI for the given item
 * @param {os.ui.filter.op.Op} op
 * @return {?string}
 */
os.ui.filter.ExpressionCtrl.prototype.getUi = function(op) {
  return op ? op.getUi() : null;
};
goog.exportProperty(os.ui.filter.ExpressionCtrl.prototype, 'getUi', os.ui.filter.ExpressionCtrl.prototype.getUi);
