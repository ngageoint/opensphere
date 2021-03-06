goog.module('os.ui.help.ControlBlockUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const OSWindow = goog.require('os.ui.window');
const {ROOT, isOSX} = goog.require('os');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyNames = goog.require('goog.events.KeyNames');
const {toTitleCase} = goog.require('goog.string');


/**
 * The controlblock directive
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'controls': '='
  },
  templateUrl: ROOT + 'views/help/controlblock.html',
  controller: Controller,
  controllerAs: 'controlBlock'
});


/**
 * Add the directive to the module.
 */
Module.directive('controlblock', [directive]);


/**
 * Map of keycodes to their OSX equivalents.
 * @type {Object<KeyCodes<number>, string>}
 */
const osxKeyCodeMap = {
  [KeyCodes.META]: 'Command',
  [KeyCodes.ALT]: 'Option'
};


/**
 * Controller function for the controlblock directive
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
   * Clean up.
   * @protected
   */
  $onDestroy() {}

  /**
   * Close the window.
   * @export
   */
  cancel() {
    OSWindow.close(this.element_);
  }

  /**
   * Get the key text
   * @param {KeyCodes} key
   * @return {string}
   * @export
   */
  getKey(key) {
    if (isOSX() && key in osxKeyCodeMap) {
      return osxKeyCodeMap[key];
    }

    return toTitleCase(KeyNames[key]);
  }

  /**
   * Get the key text
   * @param {string} other
   * @return {?string}
   * @export
   */
  getMouse(other) {
    // TODO: requiring os.ui.help.Controls creates a circular dependency, so file class needs to be decomposed
    var mouse = os.ui.help.Controls.MOUSE_IMAGE[other];
    if (mouse) {
      return mouse;
    }
    return null;
  }

  /**
   * Get the key text
   * @param {string} other
   * @return {?string}
   * @export
   */
  getFont(other) {
    var font = os.ui.help.Controls.FONT_CLASS[other];
    if (font) {
      return os.ui.help.Controls.FONT_CLASS[other]['font'];
    }
    return null;
  }

  /**
   * Get the key text
   * @param {string} other
   * @return {?string}
   * @export
   */
  getFontClass(other) {
    var font = os.ui.help.Controls.FONT_CLASS[other];
    if (font) {
      return os.ui.help.Controls.FONT_CLASS[other]['class'];
    }
    return null;
  }
}


exports = {
  Controller,
  directive
};
