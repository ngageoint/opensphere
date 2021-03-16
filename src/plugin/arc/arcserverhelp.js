goog.module('plugin.arc.ArcServerHelpUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const window = goog.require('os.ui.window');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/arc/arcserverhelp.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'arcserverhelp';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the addserver directive.
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
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;
  }

  /**
   * Close the window
   * @export
   */
  close() {
    window.close(this.element_);
  }

  /**
   * Clean up references.
   */
  $onDestroy() {
    this.element_ = null;
  }
}


exports = {
  Controller,
  directive,
  directiveTag
};
