goog.provide('os.ui.filter.ui.ExpressionNodeUI');
goog.provide('os.ui.filter.ui.expressionNodeUIDirective');
goog.require('os.ui.Module');


/**
 * The edit/delete node UI for expression nodes.
 * @return {angular.Directive}
 */
os.ui.filter.ui.expressionNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span class="glyphs pull-right slick-node-ui">' +
        '<span ng-click="nodeUi.edit()">' +
        '<i class="fa fa-pencil fa-fw glyph" title="Edit the expression"></i></span>' +
        '<span ng-click="nodeUi.remove()">' +
        '<i class="fa fa-times fa-fw glyph glyph-remove" title="Remove the expression"></i></span>' +
        '</span>',
    controller: os.ui.filter.ui.ExpressionNodeUI,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('expressionnodeui', [os.ui.filter.ui.expressionNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.ExpressionNodeUI = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
};


/**
 * Removes the expression
 */
os.ui.filter.ui.ExpressionNodeUI.prototype.remove = function() {
  var node = /** @type {os.ui.filter.ui.ExpressionNode} */ (this.scope_['item']);
  this.scope_.$emit('filterbuilder.remove', node);
};
goog.exportProperty(
    os.ui.filter.ui.ExpressionNodeUI.prototype,
    'remove',
    os.ui.filter.ui.ExpressionNodeUI.prototype.remove);


/**
 * Edits the expression
 */
os.ui.filter.ui.ExpressionNodeUI.prototype.edit = function() {
  var node = /** @type {os.ui.filter.ui.ExpressionNode} */ (this.scope_['item']);
  this.scope_.$emit('advancedfilterbuilder.editExpr', node);
};
goog.exportProperty(
    os.ui.filter.ui.ExpressionNodeUI.prototype,
    'edit',
    os.ui.filter.ui.ExpressionNodeUI.prototype.edit);
