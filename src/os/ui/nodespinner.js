goog.provide('os.ui.NodeSpinnerCtrl');
goog.provide('os.ui.nodeSpinnerDirective');

goog.require('goog.events.EventType');
goog.require('os.ui.Module');


/**
 * A spinner directive for a node that loads items
 * @return {angular.Directive}
 */
os.ui.nodeSpinnerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span ng-show="item.isLoading()" class="middle ng-hide"><i class="fa fa-fw" ng-class="spinClass" ' +
        'title="Loading..."></i></span>',
    controller: os.ui.NodeSpinnerCtrl,
    controllerAs: 'spin'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('nodespinner', [os.ui.nodeSpinnerDirective]);



/**
 * Controller for the node spinner directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.NodeSpinnerCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  if (!$scope['spinClass']) {
    $scope['spinClass'] = os.ui.NodeSpinnerCtrl.DEFAULT_CLASS;
  }

  if ('item' in this.scope_) {
    var item = /** @type {goog.events.Listenable} */ (this.scope_['item']);
    if ('isLoading' in this.scope_['item']) {
      item.listen(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
    }
  }

  this.scope_.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Default icon class for the spinner.
 * @type {string}
 * @const
 */
os.ui.NodeSpinnerCtrl.DEFAULT_CLASS = 'fa-spin fa-spinner';


/**
 * Cleans up the property change listener
 * @private
 */
os.ui.NodeSpinnerCtrl.prototype.onDestroy_ = function() {
  if (this.scope_) {
    var item = /** @type {goog.events.Listenable} */ (this.scope_['item']);
    item.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);

    this.scope_ = null;
  }
};


/**
 * Handles the loading property change
 * @param {os.events.PropertyChangeEvent} e The change event
 * @private
 */
os.ui.NodeSpinnerCtrl.prototype.onPropertyChange_ = function(e) {
  if (e.getProperty() == 'loading') {
    os.ui.apply(this.scope_);
  }
};
