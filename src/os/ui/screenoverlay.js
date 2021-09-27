goog.declareModuleId('os.ui.ScreenOverlayUI');

import {ROOT} from '../os.js';
import Module from './module.js';
import {create, exists} from './window.js';
import WindowEventType from './windoweventtype.js';
const {getMapContainer} = goog.require('os.map.instance');


/**
 * A confirmation window. Create a window using osWindow.create, supplying the necessary scope/window options.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  transclude: true,
  scope: true,
  replace: true,
  templateUrl: ROOT + 'views/windows/screenoverlay.html',
  controller: Controller,
  controllerAs: 'confirm'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'screenoverlay';

/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the overlay window directive.
 *
 * The scope.valid field can be set from window options.  If it is not set, it defaults
 * to true. It controls the button that runs the "confirmCallback"
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    if ($scope['valid'] == null) {
      $scope['valid'] = true;
    }
    $scope.$emit(WindowEventType.READY);
  }
}

/**
 * Launch a dialog with the overlay image.
 *
 * @param {!osx.window.ScreenOverlayOptions} options The overlay options.
 */
export const launchScreenOverlay = function(options) {
  var scopeOptions = {
    'image': options.image
  };

  var size = options.size || [250, 75];
  var width = Math.max(size[0], 250);
  var height = size[1] === 0 ? 'auto' : Math.max(size[1], 75);

  var xLoc = options.xy ? options.xy[0] : 25;
  var yLoc = options.xy ? options.xy[1] : 50;

  var mapSize = getMapContainer().getMap().getSize();

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
    'overlay': true,
    'border': false
  };

  var template = '<screenoverlay></screenoverlay>';
  if (!exists(options.id)) {
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
