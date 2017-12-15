goog.provide('os.ui.filter.ui.GroupNodeViewUICtrl');
goog.provide('os.ui.filter.ui.GroupNodeViewUIDirective');
goog.require('os.ui.Module');


/**
 * The view node UI for expression nodes.
 * @return {angular.Directive}
 */
os.ui.filter.ui.GroupNodeViewUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span>' +
        '<span>{{groupUi.group}}</span>' +
        '</span>',
    controller: os.ui.filter.ui.GroupNodeViewUICtrl,
    controllerAs: 'groupUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('groupnodeviewui', [os.ui.filter.ui.GroupNodeViewUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.GroupNodeViewUICtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var node = /** @type {os.ui.filter.ui.GroupNode} */ (this.scope_['item']);
  this['group'] = os.ui.filter.ui.GroupNodeViewUICtrl.GROUPS[node.getGrouping()];
};


/**
 * Available groupings for advanced filter grouping nodes.
 * @type {Object<string, string>}
 * @const
 */
os.ui.filter.ui.GroupNodeViewUICtrl.GROUPS = {
  'And': 'All (AND)',
  'Or': 'Any (OR)',
  'Not': 'Not'
};
