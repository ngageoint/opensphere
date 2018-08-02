goog.provide('os.ui.NodeIconsCtrl');
goog.provide('os.ui.nodeIconsDirective');
goog.require('goog.string');
goog.require('os.ui.Module');


/**
 * The nodeicons directive
 * @return {angular.Directive}
 */
os.ui.nodeIconsDirective = function() {
  return {
    restrict: 'E',
    template: '<span class="tree-icons"></span>',
    controller: os.ui.NodeIconsCtrl,
    controllerAs: 'nodeicons'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('nodeicons', [os.ui.nodeIconsDirective]);



/**
 * Controller function for the nodeicons directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.NodeIconsCtrl = function($scope, $element, $compile) {
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

  /**
   * @type {?angular.$compile}
   * @private
   */
  this.compile_ = $compile;

  if ('item' in this.scope_) {
    var item = /** @type {goog.events.Listenable} */ (this.scope_['item']);
    if ('getIcons' in this.scope_['item']) {
      item.listen(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
      this.updateIcons_();
    }
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * The default icon content.
 * @type {string}
 * @private
 */
os.ui.NodeIconsCtrl.DEFAULT_CONTENT_ = '&nbsp;';


/**
 * Clean up.
 * @private
 */
os.ui.NodeIconsCtrl.prototype.destroy_ = function() {
  if (this.scope_) {
    var item = /** @type {goog.events.Listenable} */ (this.scope_['item']);
    item.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);

    this.scope_ = null;
    this.element_ = null;
    this.compile_ = null;
  }
};


/**
 * Handles the loading property change
 * @param {os.events.PropertyChangeEvent} e The change event
 * @private
 */
os.ui.NodeIconsCtrl.prototype.onPropertyChange_ = function(e) {
  if (e.getProperty() == 'icons') {
    this.updateIcons_();
  }
};


/**
 * Updates the icons displayed by the directive.
 * @private
 */
os.ui.NodeIconsCtrl.prototype.updateIcons_ = function() {
  if (this.scope_ && this.element_) {
    var spanEl = this.element_.find('.tree-icons');
    var iconHtml = /** @type {string} */ (this.scope_['item']['getIcons']()) || os.ui.NodeIconsCtrl.DEFAULT_CONTENT_;
    spanEl.html(iconHtml);
    this.compile_(spanEl.contents())(this.scope_);
  }
};
