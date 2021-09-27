goog.declareModuleId('plugin.position.CopyPositionUI');

import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import * as osWindow from '../../os/ui/window.js';
import WindowEventType from '../../os/ui/windoweventtype.js';

const dispose = goog.require('goog.dispose');
const dom = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const MapContainer = goog.require('os.MapContainer');
const Metrics = goog.require('os.metrics.Metrics');
const keys = goog.require('os.metrics.keys');
const MousePosition = goog.require('os.ol.control.MousePosition');


/**
 * A directive to launch the copy coordinates GUI
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'value': '='
  },
  templateUrl: ROOT + 'views/plugin/position/positionplugin.html',
  controller: Controller,
  controllerAs: 'copyPosition'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'copy-position';


/**
 * Add the directive to the module
 */
Module.directive('copyPosition', [directive]);


/**
 * Create a popup with the current map (mouse) location information to be copied
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
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(dom.getDocument());
    this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    dispose(this.keyHandler_);

    this.element_ = null;
  }

  /**
   * Close the window
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Close the window if the user hits ENTER
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    if (event.keyCode == KeyCodes.ENTER) {
      this.close();
    }
  }
}

/**
 * Launch the copy coordinates window
 *
 * @param {string} value
 */
export const launchCopyPositionWindow = (value) => {
  var id = 'copyPosition';

  if (osWindow.exists(id)) {
    osWindow.bringToFront(id);
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

    var template = `<${directiveTag} value="value"></${directiveTag}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

/**
 * @param {ol.Coordinate=} opt_coord The coordinate
 */
export const launchCopy = function(opt_coord) {
  Metrics.getInstance().updateMetric(keys.Map.COPY_COORDINATES, 1);
  var controls = MapContainer.getInstance().getMap().getControls().getArray();
  var mousePos = null;
  for (var i = 0, n = controls.length; i < n; i++) {
    if (controls[i] instanceof MousePosition) {
      mousePos = /** @type {os.ol.control.MousePosition} */ (controls[i]);
      break;
    }
  }

  if (mousePos) {
    var positionString = mousePos.getPositionString(opt_coord);
    if (positionString) {
      launchCopyPositionWindow(positionString);
    }
  }
};
