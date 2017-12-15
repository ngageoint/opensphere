goog.provide('os.ui.SavedWindowCtrl');
goog.provide('os.ui.savedWindowDirective');
goog.require('goog.object');
goog.require('os.config.Settings');
goog.require('os.ui.Module');
goog.require('os.ui.WindowCtrl');
goog.require('os.ui.windowDirective');


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
os.ui.savedWindowDirective = function() {
  var dir = os.ui.windowDirective();
  dir.scope['key'] = '@';
  dir.controller = os.ui.SavedWindowCtrl;

  return dir;
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('savedwindow', [os.ui.savedWindowDirective]);



/**
 * Controller for the saved window directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 * @extends {os.ui.WindowCtrl}
 */
os.ui.SavedWindowCtrl = function($scope, $element, $timeout) {
  // copy config to scope
  goog.object.extend($scope, os.ui.SavedWindowCtrl.getConf_($scope['key']));
  os.ui.SavedWindowCtrl.base(this, 'constructor', $scope, $element, $timeout);
};
goog.inherits(os.ui.SavedWindowCtrl, os.ui.WindowCtrl);


/**
 * @inheritDoc
 */
os.ui.SavedWindowCtrl.prototype.onChange = function(event, ui) {
  if (ui) {
    var conf = os.ui.SavedWindowCtrl.getConf_(this.scope['key']);
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

    os.ui.SavedWindowCtrl.setConf_(this.scope['key'], conf);
  }

  os.ui.SavedWindowCtrl.superClass_.onChange.call(this, event, ui);
};


/**
 * Gets the window config
 * @param {string} key The window key
 * @return {Object}
 * @private
 */
os.ui.SavedWindowCtrl.getConf_ = function(key) {
  var wins = os.settings.get(['windows']) || {};
  return wins[key] || {};
};


/**
 * Sets and saves the window config
 * @param {string} key The window key
 * @param {Object} value
 * @private
 */
os.ui.SavedWindowCtrl.setConf_ = function(key, value) {
  var wins = os.settings.get(['windows']) || {};
  wins[key] = value;
  os.settings.set(['windows'], wins);
};
