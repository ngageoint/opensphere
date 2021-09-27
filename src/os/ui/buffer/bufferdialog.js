goog.declareModuleId('os.ui.buffer.BufferDialogUI');

import './bufferform.js';
import {getSource} from '../../feature/feature.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';
const {ICON, createFromConfig, getBaseConfig} = goog.require('os.buffer');

const {BufferConfig} = goog.requireType('os.buffer');


/**
 * The bufferdialog directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/buffer/bufferdialog.html',
  controller: Controller,
  controllerAs: 'buffer'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'bufferdialog';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the bufferdialog directive
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
     * @type {BufferConfig}
     * @protected
     */
    this.config = $scope['config'] = getBaseConfig();

    /**
     * Warning message to display in the UI.
     * @type {string}
     */
    this['warningMessage'] = '';

    if ($scope['features'] && $scope['features'].length > 0) {
      // features were provided so hide the source picker
      this.config['features'] = $scope['features'];
      this['showSourcePicker'] = false;

      // if the features have a source and it's the same for all features, set the source so columns will be displayed
      var source = getSource(this.config['features'][0]);
      if (source) {
        for (var i = 0; i < this.config['features'].length; i++) {
          if (getSource(this.config['features'][0]) != source) {
            source = null;
            break;
          }
        }

        $scope['sources'] = source ? [source] : undefined;
      }
    } else {
      // features weren't provided, allow the user to choose from loaded sources
      this['showSourcePicker'] = true;
    }

    // title override was provided
    if ($scope['title']) {
      this.config['title'] = $scope['title'];
    }

    $scope.$on('$destroy', this.destroy_.bind(this));
    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.element_ = null;
  }

  /**
   * Close the window.
   *
   * @export
   */
  cancel() {
    osWindow.close(this.element_);
  }

  /**
   * Create buffer regions and close the window.
   *
   * @export
   */
  confirm() {
    createFromConfig(this.config);
    this.cancel();
  }

  /**
   * Get the status text to display at the bottom of the dialog.
   *
   * @return {string}
   * @export
   */
  getStatus() {
    if (!this['showSourcePicker']) {
      return '';
    }

    if (!this.isDataReady()) {
      return 'No features chosen.';
    }

    var count = this.config['features'].length;
    return count + ' feature' + (count > 1 ? 's' : '') + ' chosen.';
  }

  /**
   * If the status display is valid.
   *
   * @return {string}
   * @export
   */
  isDataReady() {
    return !this['showSourcePicker'] || (this.config && this.config['features'] && this.config['features'].length > 0);
  }
}

/**
 * Launch a dialog to create buffer regions around features.
 *
 * @param {Object} options
 */
export const launchBufferDialog = function(options) {
  var windowId = 'Buffer';
  if (osWindow.exists(windowId)) {
    osWindow.bringToFront(windowId);
  } else {
    var windowOptions = {
      'id': windowId,
      'label': 'Create Buffer Region' + (options['features'] ? '' : 's'),
      'icon': 'fa ' + ICON,
      'x': 'center',
      'y': 'center',
      'width': '425',
      'min-width': '300',
      'max-width': '800',
      'height': 'auto',
      'show-close': 'true'
    };

    var template = `<${directiveTag}></${directiveTag}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, options);
  }
};
