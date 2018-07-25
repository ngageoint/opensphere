goog.provide('plugin.position.CopyPositionCtrl');
goog.provide('plugin.position.copyPositionDirective');
goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('os.action.EventType');
goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * A directive to launch the copy coordinates GUI
 * @return {angular.Directive}
 */
plugin.position.copyPositionDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'value': '='
    },
    templateUrl: os.ROOT + 'views/plugin/position/positionplugin.html',
    controller: plugin.position.CopyPositionCtrl,
    controllerAs: 'copyPosition'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('copyPosition', [plugin.position.copyPositionDirective]);



/**
 * Create a popup with the current map (mouse) location information to be copied
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
plugin.position.CopyPositionCtrl = function($scope, $element) {
  plugin.position.CopyPositionCtrl.base(this, 'constructor');

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);

  $scope.$emit(os.ui.WindowEventType.READY);

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};
goog.inherits(plugin.position.CopyPositionCtrl, goog.Disposable);


/**
 * Clean up
 * @private
 */
plugin.position.CopyPositionCtrl.prototype.onDestroy_ = function() {
  goog.dispose(this.keyHandler_);

  this.element_ = null;
};


/**
 * Close the window
 */
plugin.position.CopyPositionCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};


/**
 * Close the window if the user hits ENTER
 * @param {goog.events.KeyEvent} event
 * @private
 */
plugin.position.CopyPositionCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ENTER) {
    this.close();
  }
};


/**
 * Launch the copy coordinates window
 * @param {string} value
 */
plugin.position.CopyPositionCtrl.launch = function(value) {
  var id = 'copyPosition';

  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
  } else {
    var windowOptions = {
      'id': id,
      'label': 'Copy Coordinates',
      'icon': 'fa fa-sticky-note',
      'x': 'center',
      'y': 'center',
      'width': '300',
      'height': 'auto',
      'modal': 'true'
    };
    var scopeOptions = {
      'value': value
    };

    var template = '<copy-position value="value"></copy-position>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
