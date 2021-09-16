goog.module('os.ui.NodeToggleUI');

const GoogEventType = goog.require('goog.events.EventType');
const {instanceOf} = goog.require('os.classRegistry');
const {NodeClass} = goog.require('os.data');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');

const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');
const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * A toggle directive for a node that expands/collapses the children
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<i class="js-node-toggle c-node-toggle fa fa-fw" ' +
      'ng-class="{\'{{collapsedIcon}}\': item.collapsed, \'{{expandedIcon}}\': !item.collapsed}"></i>',
  controller: Controller,
  controllerAs: 'toggle'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'nodetoggle';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the node spinner directive
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
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {string}
     */
    this.scope_['expandedIcon'] = Controller.DEFAULT_EXPANDED;

    /**
     * @type {string}
     */
    this.scope_['collapsedIcon'] = Controller.DEFAULT_COLLAPSED;

    if (instanceOf(this.scope_['item'], NodeClass.SLICK)) {
      var item = /** @type {SlickTreeNode} */ (this.scope_['item']);
      item.listen(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
      this.updateIcons_();
      this.updateOpacity();
    }

    this.scope_.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Cleans up the property change listener
   *
   * @private
   */
  onDestroy_() {
    if (this.scope_) {
      var item = /** @type {SlickTreeNode} */ (this.scope_['item']);
      item.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
    }


    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Handles the loading property change
   *
   * @param {PropertyChangeEvent} e The change event
   * @protected
   */
  onPropertyChange(e) {
    var p = e.getProperty();
    if (p == 'children') {
      this.updateOpacity();
    }
    if (p == 'icons') {
      this.updateIcons_();
    }
  }

  /**
   * @protected
   */
  updateOpacity() {
    var item = /** @type {SlickTreeNode} */ (this.scope_['item']);
    var children = item.getChildren();
    this.element_.css('opacity', children && children.length > 0 ? '1' : '0');
  }

  /**
   * Updates the icons displayed by the directive.
   *
   * @private
   */
  updateIcons_() {
    var item = /** @type {SlickTreeNode} */ (this.scope_['item']);
    var icons = item.getToggleIcons();
    if (icons) {
      this.scope_['collapsedIcon'] = icons['collapsed'] || Controller.DEFAULT_COLLAPSED;
      this.scope_['expandedIcon'] = icons['expanded'] || Controller.DEFAULT_EXPANDED;
    }

    apply(this.scope_);
  }
}

/**
 * The default expanded icon content.
 * @type {string}
 */
Controller.DEFAULT_EXPANDED = 'fa-caret-down';

/**
 * The default collapsed icon content.
 * @type {string}
 */
Controller.DEFAULT_COLLAPSED = 'fa-caret-right';

exports = {
  Controller,
  directive,
  directiveTag
};
