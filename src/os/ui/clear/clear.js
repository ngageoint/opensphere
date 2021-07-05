goog.module('os.ui.clear.ClearUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const ClearManager = goog.require('os.ui.clear.ClearManager');
const {close} = goog.require('os.ui.window');


/**
 * The clear window directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/window/clear.html',
  controller: Controller,
  controllerAs: 'clear'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'clear';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the Clear Window
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
     * The Angular scope.
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
     * The clear entries to display
     * @type {!Array<!osx.ChecklistItem>}
     */
    this['entries'] = Object.values(ClearManager.getInstance().getEntries());

    // fired when the user closes the window with the 'x' button
    $scope.$on(WindowEventType.CANCEL, this.cancelInternal_.bind(this));
  }

  /**
   * Angular $onDestroy lifecycle function.
   */
  $onDestroy() {
    this.element_ = null;
    this.scope_ = null;
  }

  /**
   * Angular $onInit lifecycle function.
   */
  $onInit() {
    this.scope_.$emit(WindowEventType.READY);
  }

  /**
   * Close the window
   *
   * @private
   */
  close_() {
    if (this.element_) {
      close(this.element_);
    }
  }

  /**
   * Handle user hitting the window 'x' button
   *
   * @private
   */
  cancelInternal_() {
    // reset clear entries from settings
    ClearManager.getInstance().reset();
  }

  /**
   * Handle user clicking the Cancel button
   *
   * @export
   */
  cancel() {
    // reset and close the window
    this.cancelInternal_();
    this.close_();
  }

  /**
   * Handle user clicking the OK button
   *
   * @export
   */
  accept() {
    // clear selected entries and close the window
    ClearManager.getInstance().clear();
    this.close_();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
