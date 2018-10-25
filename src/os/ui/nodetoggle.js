goog.provide('os.ui.NodeToggleCtrl');
goog.provide('os.ui.nodeToggleDirective');
goog.require('goog.events.EventType');
goog.require('os.ui.Module');


/**
 * A toggle directive for a node that expands/collapses the children
 * @return {angular.Directive}
 */
os.ui.nodeToggleDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<i class="js-node-toggle c-node-toggle fa fa-fw" ' +
        'ng-class="{\'fa-caret-right\': item.collapsed, \'fa-caret-down\': !item.collapsed}"></i>',
    controller: os.ui.NodeToggleCtrl,
    controllerAs: 'toggle'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('nodetoggle', [os.ui.nodeToggleDirective]);



/**
 * Controller for the node spinner directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.NodeToggleCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  if (this.scope_['item'] instanceof os.ui.slick.SlickTreeNode) {
    var item = /** @type {os.ui.slick.SlickTreeNode} */ (this.scope_['item']);
    item.listen(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);

    this.updateOpacity();
  }

  this.scope_.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Cleans up the property change listener
 * @private
 */
os.ui.NodeToggleCtrl.prototype.onDestroy_ = function() {
  if (this.scope_) {
    var item = /** @type {os.ui.slick.SlickTreeNode} */ (this.scope_['item']);
    item.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
  }


  this.scope_ = null;
  this.element_ = null;
};


/**
 * Handles the loading property change
 * @param {os.events.PropertyChangeEvent} e The change event
 * @protected
 */
os.ui.NodeToggleCtrl.prototype.onPropertyChange = function(e) {
  var p = e.getProperty();
  if (p == 'children') {
    this.updateOpacity();
  }
};


/**
 * @protected
 */
os.ui.NodeToggleCtrl.prototype.updateOpacity = function() {
  var item = /** @type {os.ui.slick.SlickTreeNode} */ (this.scope_['item']);
  var children = item.getChildren();
  this.element_.css('opacity', children && children.length > 0 ? '1' : '0');
};
