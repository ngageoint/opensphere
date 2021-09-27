goog.declareModuleId('os.ui.NodeSpinnerUI');

import Module from './module.js';
import {apply} from './ui.js';

const GoogEventType = goog.require('goog.events.EventType');

const Listenable = goog.requireType('goog.events.Listenable');
const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');


/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span ng-show="item.isLoading()" class="ng-hide"><i class="fa fa-fw" ng-class="spinClass" ' +
      'title="Loading..."></i></span>',
  controller: Controller,
  controllerAs: 'spin'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'nodespinner';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the node spinner directive
 * @unrestricted
 */
export class Controller {
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

    if (!$scope['spinClass']) {
      $scope['spinClass'] = Controller.DEFAULT_CLASS;
    }

    if ('item' in this.scope_) {
      var item = /** @type {Listenable} */ (this.scope_['item']);
      if ('isLoading' in this.scope_['item']) {
        item.listen(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
      }
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
      var item = /** @type {Listenable} */ (this.scope_['item']);
      item.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);

      this.scope_ = null;
    }
  }

  /**
   * Handles the loading property change
   *
   * @param {PropertyChangeEvent} e The change event
   * @private
   */
  onPropertyChange_(e) {
    if (e.getOldValue() != e.getNewValue() && e.getProperty() == 'loading') {
      apply(this.scope_);
    }
  }
}

/**
 * Default icon class for the spinner.
 * @type {string}
 * @const
 */
Controller.DEFAULT_CLASS = 'fa-spin fa-spinner';
