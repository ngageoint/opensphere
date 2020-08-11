goog.provide('os.ui.ScreenOverlayCtrl');
goog.provide('os.ui.screenOverlayDrective');

goog.require('goog.events.KeyHandler');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * A confirmation window. Create a window using os.ui.window.create, supplying the necessary scope/window options.
 *
 * @return {angular.Directive}
 */
os.ui.screenOverlayDrective = function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: true,
    replace: true,
    templateUrl: os.ROOT + 'views/windows/screenoverlay.html',
    controller: os.ui.ScreenOverlayCtrl,
    controllerAs: 'confirm'
  };
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('screenoverlay', [os.ui.screenOverlayDrective]);


/**
 * Launch a dialog with the overlay image.
 *
 * @param {!osx.window.ScreenOverlayOptions} options The overlay options.
 */
os.ui.launchScreenOverlay = function(options) {
  var scopeOptions = {
    'image': options.image
  };

  var size = options.size || [250, 75];
  var width = Math.max(size[0], 250);
  var height = size[1] === 0 ? 'auto' : Math.max(size[1], 75);

  var xLoc = options.xy ? options.xy[0] : 25;
  var yLoc = options.xy ? options.xy[1] : 50;

  var mapSize = os.MapContainer.getInstance().getMap().getSize();

  var windowOptions = {
    'id': options.id,
    'label': options.name || 'Screen Overlay',
    'icon': '',
    'x': xLoc,
    'y': yLoc,
    'width': width,
    'min-width': 250,
    'max-width': mapSize[0],
    'height': height,
    'min-height': 75,
    'max-height': mapSize[1],
    'modal': false,
    'show-hide': !!options.showHide,
    'show-close': !!options.showClose,
    'no-scroll': true,
    'overlay': true,
    'border': false
  };

  var template = '<screenoverlay></screenoverlay>';
  if (!os.ui.window.exists(options.id)) {
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};



/**
 * Controller for the overlay window directive.
 *
 * The scope.valid field can be set from window options.  If it is not set, it defaults
 * to true. It controls the button that runs the "confirmCallback"
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.ScreenOverlayCtrl = function($scope) {
  if ($scope['valid'] == null) {
    $scope['valid'] = true;
  }
};
