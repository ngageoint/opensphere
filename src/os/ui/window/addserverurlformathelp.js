goog.module('os.ui.window.AddServerUrlFormatHelpUI');

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
    templateUrl: os.ROOT + 'views/window/addserverurlformathelp.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'urlhelp';


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
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {string}
     */
    this['helpText'] = '';

    /**
     * @type {string}
     */
    this['currentItem'] = '';

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Change the help text
   * @param {string} newText
   * @export
   */
  setHelpText(newText) {
    this['helpText'] = newText;
  }

  /**
   * Update the current item
   * @param {string} newItem
   * @export
   */
  setCurrentItem(newItem) {
    this['currentItem'] = newItem;
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
   * @private
   */
  onDestroy_() {
    this.element_ = null;
  }
}


/**
 * Launches the add server url format help dialog if one isn't displayed already.
 * @param {string} currentItem
 * @param {string} helpText
 */
const launchAddServerUrlFormatHelpWindow = function(currentItem, helpText) {
  const id = 'url-help';
  const item = currentItem + ' ';
  const scopeOptions = {
    'helpText': helpText
  };
  if (!document.getElementById(id)) {
    window.create({
      'label': item + 'Formats',
      'icon': 'fa fa-clock-o',
      'x': '-10',
      'y': 'center',
      'width': '445',
      'min-width': '250',
      'max-width': '600',
      'height': '445',
      'min-height': '250',
      'max-height': '600',
      'show-close': true,
      'modal': true
    }, 'urlhelp', undefined, undefined, undefined, scopeOptions);
  }
};


exports = {
  Controller,
  directive,
  launchAddServerUrlFormatHelpWindow
};
