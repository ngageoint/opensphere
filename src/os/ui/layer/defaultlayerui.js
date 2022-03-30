goog.declareModuleId('os.ui.layer.DefaultLayerUI');

import Layer from 'ol/src/layer/Layer.js';
import UrlTile from 'ol/src/source/UrlTile.js';

import LayerAutoRefresh from '../../command/layerautorefreshcmd.js';
import LayerStyle from '../../command/layerstylecmd.js';
import Settings from '../../config/settings.js';
import * as osLayer from '../../layer/layer.js';
import PropertyChange from '../../layer/propertychange.js';
import {ROOT} from '../../os.js';
import VectorSource from '../../source/vectorsource.js';
import ColorControlType from '../colorcontroltype.js';
import ControlType from '../controltype.js';
import Module from '../module.js';
import AbstractLayerUICtrl from './abstractlayerui.js';
import {REFRESH_DURATIONS} from './layers.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * Default layer controls.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/layer/default.html',
  controller: Controller,
  controllerAs: 'defaultCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'defaultlayerui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the default layer UI.
 * @unrestricted
 */
export class Controller extends AbstractLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element);
    this.initEvents.push(PropertyChange.REFRESH_INTERVAL);

    /**
     * The selected Auto Refresh option.
     * @type {?osx.layer.RefreshOption}
     */
    this['refresh'] = null;

    /**
     * The available Auto Refresh options.
     * @type {!Array<!osx.layer.RefreshOption>}
     */
    this['refreshOptions'] = REFRESH_DURATIONS;

    /**
     * If the Auto Refresh option should be displayed.
     * @type {boolean}
     */
    this['showRefresh'] = false;

    /**
     * If the color picker should be included in the UI.
     * @type {boolean}
     */
    this['showColorPicker'] = false;

    /**
     * If the reset button should be displayed in the color picker.
     * @type {boolean}
     */
    this['showColorReset'] = false;

    /**
     * If the hue slider should be displayed.
     * @type {boolean}
     */
    this['showHue'] = false;

    /**
     * If brightness/saturation should be displayed.
     * @type {boolean}
     */
    this['showBasicColor'] = false;

    /**
     * @type {Object<string, number>}
     * @protected
     */
    this.defaults = {
      'brightness': 0,
      'contrast': 1,
      'hue': 0,
      'opacity': 1,
      'saturation': 1,
      'sharpness': 0
    };

    /**
     * The default color control to display when undefined or varied between layers.
     * @type {!ColorControlType}
     * @protected
     */
    this.defaultColorControl = ColorControlType.NONE;

    /**
     * @type {Object}
     * @protected
     */
    this.initialValues = {};

    var properties = this.getProperties();

    // Listen for slider start, change and stop events for each of the slider properties. These will handle live updates
    // of the layer in the view as well as placing commands on the stack on stop for each change.
    for (var key in properties) {
      var fn = properties[key];
      $scope.$on(key + '.slide', this.onValueChange.bind(this, fn));
      $scope.$on(key + '.slidestart', this.onSliderStart.bind(this));
      $scope.$on(key + '.slidestop', this.onSliderStop.bind(this, fn, key));
    }
  }

  /**
   * Angular $onInit lifecycle function.
   */
  $onInit() {
    this.initUI();
    this.setInitialValues_();

    if (this.element) {
      var selector = /** @type {string} */ (Settings.getInstance().get('layercontrols', ''));
      if (selector) {
        var section = this.element.find(selector);
        if (section) {
          $(section).collapse('show');
        }
      }
    }
  }

  /**
   * The basic layer properties controlled by this UI.
   *
   * @return {Object}
   */
  getProperties() {
    return {
      'opacity': osLayer.setOpacity,
      'brightness': osLayer.setBrightness,
      'contrast': osLayer.setContrast,
      'hue': osLayer.setHue,
      'saturation': osLayer.setSaturation,
      'sharpness': osLayer.setSharpness
    };
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (!this.isDisposed()) {
      this.scope['brightness'] = this.getValue(osLayer.getBrightness, 0);
      this.scope['contrast'] = this.getValue(osLayer.getContrast);
      this.scope['hue'] = this.getValue(osLayer.getHue, 0);
      this.scope['opacity'] = this.getOpacity();
      this.scope['saturation'] = this.getValue(osLayer.getSaturation);
      this.scope['sharpness'] = this.getValue(osLayer.getSharpness);

      this.updateRefresh();
      this.initColorControls_();
    }
  }

  /**
   * Updates the auto refresh state on the UI.
   */
  updateRefresh() {
    this['showRefresh'] = false;
    this['refresh'] = null;

    var nodes = this.getLayerNodes();
    if (nodes && nodes.length > 0) {
      var refreshInterval;

      // only show refresh options if all sources support it
      this['showRefresh'] = nodes.every(function(node) {
        var layer = node.getLayer();
        if (layer instanceof Layer) {
          var source = layer.getSource();
          if (source instanceof VectorSource || source instanceof UrlTile &&
              source.isRefreshEnabled()) {
            if (refreshInterval == null) {
              // init the control to the refresh interval of the first item
              refreshInterval = source.getRefreshInterval();
            }

            return true;
          }
        }

        return false;
      });

      if (refreshInterval != null) {
        // find the refresh interval by interval
        this['refresh'] = this['refreshOptions'].find(function(option) {
          return option.interval == refreshInterval;
        });
      }
    }
  }

  /**
   * Initialize which color controls should be displayed.
   *
   * @private
   */
  initColorControls_() {
    // default to showing nothing
    this['showColorPicker'] = false;
    this['showColorReset'] = false;
    this['showBasicColor'] = false;
    this['showHue'] = false;

    var nodes = this.getLayerNodes();
    if (nodes && nodes.length > 0) {
      // make sure all selected layers have the same color control type
      var baseType;
      for (var i = 0, n = nodes.length; i < n; i++) {
        var layer = nodes[i].getLayer();
        if (baseType == null) {
          baseType = this.getColorControlType(layer);

          // first one doesn't have a color control, so don't show one
          if (baseType == ColorControlType.NONE) {
            break;
          }
        } else if (this.getColorControlType(layer) !== baseType) {
          // at least one layer has a different type, so don't show the control
          baseType = ColorControlType.NONE;
          break;
        }
      }

      switch (baseType) {
        case ColorControlType.PICKER_RESET:
          // show the color picker with a reset button
          this['showColorPicker'] = true;
          this['showColorReset'] = true;
          this['showBasicColor'] = true;

          break;
        case ColorControlType.PICKER:
          // show the color picker without a reset button
          this['showColorPicker'] = true;

          this['showBasicColor'] = false;
          this['showColorReset'] = false;
          break;
        case ColorControlType.BASIC:
          // show brightness, saturation
          this['showBasicColor'] = true;

          this['showColorPicker'] = false;
          this['showColorReset'] = false;

          break;
        case ColorControlType.NONE:
        default:
          // don't show any color controls
          this['showBasicColor'] = false;
          this['showColorPicker'] = false;
          this['showColorReset'] = false;
          break;
      }
    }
  }

  /**
   * Get the color control type for the provided layer.
   *
   * @param {ILayer} layer
   * @return {!ColorControlType}
   * @protected
   */
  getColorControlType(layer) {
    if (layer) {
      var options = layer.getLayerOptions();
      if (options && options[ControlType.COLOR]) {
        return /** @type {!ColorControlType} */ (options[ControlType.COLOR]);
      }
    }

    return this.defaultColorControl;
  }

  /**
   * Gets the opacity from the item(s)
   *
   * @return {number} The opacity
   */
  getOpacity() {
    return this.getValue(osLayer.getOpacity);
  }

  /**
   * Builds the current set of initial values and places them in the map.
   *
   * @private
   */
  setInitialValues_() {
    var nodes = this.getLayerNodes();
    for (var i = 0, n = nodes.length; i < n; i++) {
      var layer = nodes[i].getLayer();
      if (layer) {
        var layerId = layer.getId();
        var values = {};

        var opacity = this.getOpacity();
        values['opacity'] = opacity != null ? opacity : 0;

        var brightness = osLayer.getBrightness(layer);
        values['brightness'] = brightness != null ? brightness : 0;

        var contrast = osLayer.getContrast(layer);
        values['contrast'] = contrast != null ? contrast : 0;

        var saturation = osLayer.getSaturation(layer);
        values['saturation'] = saturation != null ? saturation : 0;

        var sharpness = osLayer.getSharpness(layer);
        values['sharpness'] = sharpness != null ? sharpness : 0;

        this.initialValues[layerId] = values;
      }
    }
  }

  /**
   * Handle changes to form controls
   *
   * @param {function(ILayer, ?)} callback
   * @param {?angular.Scope.Event} event
   * @param {?} value
   * @protected
   */
  onValueChange(callback, event, value) {
    var nodes = this.getLayerNodes();
    for (var i = 0, n = nodes.length; i < n; i++) {
      callback(nodes[i].getLayer(), value);
    }
  }

  /**
   * Handles color change slides.
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onSliderStart(event, value) {
    this.setInitialValues_();
  }

  /**
   * Handles color change slides.
   *
   * @param {function(ILayer, ?)} callback The callback for setting the value
   * @param {string} key The key representing the value
   * @param {?angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onSliderStop(callback, key, event, value) {
    var fn =
        /**
         * @param {ILayer} layer
         * @this Controller
         * @return {?ICommand}
         */
        function(layer) {
          var initialValues = this.initialValues[layer.getId()];
          var old = 1;
          if (initialValues && initialValues[key] !== undefined) {
            old = initialValues[key];
          }

          var cmd = old !== value ? new LayerStyle(layer.getId(), callback, value, old) : null;
          if (cmd) {
            cmd.title = 'Change ' + key;
          }

          return cmd;
        };

    this.createCommand(fn.bind(this));
    this.setInitialValues_();
  }

  /**
   * Set the refresh state of the source.
   *
   * @export
   */
  onRefreshChange() {
    var nodes = this.getLayerNodes();
    if (nodes && nodes.length > 0) {
      var refresh = /** @type {osx.layer.RefreshOption|undefined} */ (this['refresh']);
      var interval = refresh ? refresh.interval : 0;
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new LayerAutoRefresh(layer.getId(), interval);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Resets the value of the chosen key to the default.
   *
   * @param {string} key
   * @export
   */
  reset(key) {
    var defaultValue = this.defaults[key];
    var nodes = this.getLayerNodes();
    if (nodes && nodes[0].getLayer() != null && nodes[0].getLayer().getLayerOptions() &&
      nodes[0].getLayer().getLayerOptions()['defaults']) {
      var value = nodes[0].getLayer().getLayerOptions()['defaults'][key];
      if (value != null) {
        defaultValue = /** @type {number} */ (value);
      }
    }

    if (defaultValue != null) {
      var callback = this.getProperties()[key];
      this.onSliderStop(callback, key, null, defaultValue);
    }
  }

  /**
   * Handle accordion toggle.
   *
   * @param {string} selector The toggled selector.
   * @export
   */
  setOpenSection(selector) {
    // save the open section to settings
    var current = Settings.getInstance().get('layercontrols');
    Settings.getInstance().set('layercontrols', current != selector ? selector : '');
  }
}
