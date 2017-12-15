goog.provide('os.ui.filter.BasicFilterBuilderCtrl');
goog.provide('os.ui.filter.basicFilterBuilderDirective');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('os.filter.IFilterEntry');
goog.require('os.ui.Module');
goog.require('os.ui.filter.Expression');
goog.require('os.ui.filter.basicFilterTreeDirective');


/**
 * The filter builder directive
 * @return {angular.Directive}
 */
os.ui.filter.basicFilterBuilderDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'root': '=',
      'columns': '=',
      'isComplex': '='
    },
    templateUrl: os.ROOT + 'views/filter/basicfilterbuilder.html',
    controller: os.ui.filter.BasicFilterBuilderCtrl,
    controllerAs: 'basicCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('basicfilterbuilder', [os.ui.filter.basicFilterBuilderDirective]);



/**
 * Controller for the filter builder
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.filter.BasicFilterBuilderCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.scrollDelay_ = new goog.async.Delay(this.onScrollDelay_, 50, this);

  /**
   * @type {os.ui.filter.ui.GroupNode}
   * @private
   */
  this.root_ = /** @type {os.ui.filter.ui.GroupNode} */ ($scope['root']);

  if (!this.root_.getChildren()) {
    this.add();
  }

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Cleanup
 * @private
 */
os.ui.filter.BasicFilterBuilderCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;

  var nodes = this.root_.getChildren().slice();
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node instanceof os.ui.filter.ui.ExpressionNode) {
      var expr = node.getExpression();
      if (!expr.validate(expr['literal'])) {
        var parent = node.getParent();
        parent.removeChild(node);
      }
    }
  }
};


/**
 * Adds an expression
 * @param {Node=} opt_node
 */
os.ui.filter.BasicFilterBuilderCtrl.prototype.add = function(opt_node) {
  var child = os.ui.filter.ui.ExpressionNode.createExpressionNode(opt_node || null, this.scope_['columns']);
  this.root_.addChild(child);
  this.scrollDelay_.start();
};
goog.exportProperty(os.ui.filter.BasicFilterBuilderCtrl.prototype, 'add',
    os.ui.filter.BasicFilterBuilderCtrl.prototype.add);


/**
 * Scrolls to the last node
 * @private
 */
os.ui.filter.BasicFilterBuilderCtrl.prototype.onScrollDelay_ = function() {
  var children = this.root_.getChildren();

  if (children) {
    var item = children[children.length - 1];
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.SCROLL_TO, item);
  }
};
