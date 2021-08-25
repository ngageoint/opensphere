goog.module('os.ui.SavedWindowUI');
goog.module.declareLegacyNamespace();

const settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');
const {Controller: WindowCtrl, directive: windowDirective} = goog.require('os.ui.WindowUI');


/**
 * This is the exact same as the window control except that it saves and restores its position
 * and size from settings.
 *
 * @example
 * <pre>
 * <savedwindow key="bestWindowEver" show-close="true">
 *  ...
 * </savedwindow
 * </pre>
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = windowDirective();
  dir.scope['key'] = '@';
  dir.controller = Controller;

  return dir;
};


/**
 * Add the directive to the os module
 */
Module.directive('savedwindow', [directive]);



/**
 * Controller for the saved window directive
 * @unrestricted
 */
class Controller extends WindowCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    // copy config to scope
    Object.assign($scope, Controller.getConf_($scope['key']));
    super($scope, $element, $timeout);
  }

  /**
   * @inheritDoc
   */
  onChange(event, ui) {
    if (ui) {
      var conf = Controller.getConf_(this.scope['key']);
      var pos = ui['position'];

      if (pos) {
        conf['x'] = pos['left'];
        conf['y'] = pos['top'];
      }

      var size = ui['size'];
      if (size) {
        conf['width'] = size['width'];
        conf['height'] = size['height'];
      }

      Controller.setConf_(this.scope['key'], conf);
    }

    super.onChange(event, ui);
  }

  /**
   * @inheritDoc
   */
  getWindowKeys() {
    var keys = super.getWindowKeys();

    var key = this.scope ? /** @type {string|undefined} */ (this.scope['key']) : undefined;
    if (key) {
      keys.push(key);
    }

    return keys;
  }

  /**
   * Gets the window config
   *
   * @param {string} key The window key
   * @return {Object}
   * @private
   */
  static getConf_(key) {
    var wins = settings.getInstance().get(['windows']) || {};
    return wins[key] || {};
  }

  /**
   * Sets and saves the window config
   *
   * @param {string} key The window key
   * @param {Object} value
   * @private
   */
  static setConf_(key, value) {
    var wins = settings.getInstance().get(['windows']) || {};
    wins[key] = value;
    settings.getInstance().set(['windows'], wins);
  }
}

exports = {
  Controller,
  directive
};
