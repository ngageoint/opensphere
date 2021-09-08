goog.module('os.ui.NodeIconsUI');

const GoogEventType = goog.require('goog.events.EventType');
const Module = goog.require('os.ui.Module');

const Listenable = goog.requireType('goog.events.Listenable');
const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');


/**
 * The nodeicons directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  template: '<span class="js-node-icons align-text-bottom pr-1 c-node-icons"></span>',
  controller: Controller,
  controllerAs: 'nodeicons'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'nodeicons';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the nodeicons directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
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
      var item = /** @type {Listenable} */ (this.scope_['item']);
      if ('getIcons' in this.scope_['item']) {
        item.listen(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
        this.updateIcons_();
      }
    }

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    if (this.scope_) {
      var item = /** @type {Listenable} */ (this.scope_['item']);
      item.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);

      this.scope_ = null;
      this.element_ = null;
      this.compile_ = null;
    }
  }

  /**
   * Handles the loading property change
   *
   * @param {PropertyChangeEvent} e The change event
   * @private
   */
  onPropertyChange_(e) {
    if (e.getProperty() == 'icons') {
      this.updateIcons_();
    }
  }

  /**
   * Updates the icons displayed by the directive.
   *
   * @private
   */
  updateIcons_() {
    if (this.scope_ && this.element_) {
      var spanEl = this.element_.find('.js-node-icons');
      var iconHtml = /** @type {string} */ (this.scope_['item']['getIcons']()) || defaultContent;
      spanEl.html(iconHtml);
      this.compile_(spanEl.contents())(this.scope_);
    }
  }
}

/**
 * The default icon content.
 * @type {string}
 * @private
 */
const defaultContent = '&nbsp;';

exports = {
  Controller,
  directive,
  directiveTag
};
