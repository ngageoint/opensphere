goog.declareModuleId('plugin.im.action.feature.ui.StyleConfigUI');

import '../../../os/ui/layer/iconstylecontrols.js';
import '../../../os/ui/layer/vectorstylecontrols.js';
import * as osColor from '../../../os/color.js';
import DataManager from '../../../os/data/datamanager.js';
import * as dispatcher from '../../../os/dispatcher.js';
import Fields from '../../../os/fields/fields.js';
import instanceOf from '../../../os/instanceof.js';
import * as osObject from '../../../os/object/object.js';
import VectorSource from '../../../os/source/vectorsource.js';
import * as osStyle from '../../../os/style/style.js';
import StyleField from '../../../os/style/stylefield.js';
import * as kml from '../../../os/ui/file/kml/kml.js';
import IconPickerEventType from '../../../os/ui/icon/iconpickereventtype.js';
import EventType from '../../../os/ui/im/action/eventtype.js';
import * as layer from '../../../os/ui/layer/layers.js';
import VectorStyleControlsEventType from '../../../os/ui/layer/vectorstylecontrolseventtype.js';
import Module from '../../../os/ui/module.js';
import ActionConfigCtrl from './featureactionconfig.js';

const googArray = goog.require('goog.array');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');

/**
 * Directive to configure a feature style action.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,

  template: '<div><vectorstylecontrols color="color" opacity="opacity" size="size" line-dash="lineDash"' +
      'icon="icon" center-icon="centerIcon" icon-set="ctrl.iconSet" icon-src="ctrl.iconSrc" ' +
      'shape="shape" shapes="shapes" center-shape="centerShape" center-shapes="centerShapes" ' +
      'show-color-reset="true" fill-color="fillColor" fill-opacity="fillOpacity"></vectorstylecontrols>' +
      '<iconstylecontrols ng-show="ctrl.showRotationOption()" columns="columns" show-rotation="showRotation" ' +
      'rotation-column="rotationColumn"></iconstylecontrols></div>',

  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureactionstyleconfig';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for setting a feature style.
 *
 * @extends {ActionConfigCtrl<StyleAction>}
 * @unrestricted
 */
export class Controller extends ActionConfigCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * Icons available to the icon picker.
     * @type {!Array<!osx.icon.Icon>}
     */
    this['iconSet'] = kml.GOOGLE_EARTH_ICON_SET;

    /**
     * Function to translate image sources from the icon set.
     * @type {function(string):string}
     */
    this['iconSrc'] = kml.replaceGoogleUri;

    /**
     * The action style config.
     * @type {Object}
     * @protected
     */
    this.styleConfig = /** @type {!Object} */ (osObject.unsafeClone(osStyle.DEFAULT_VECTOR_CONFIG));

    /**
     * The original style color, for the Reset button.
     * @type {string|undefined}
     * @protected
     */
    this.initialColor = undefined;

    if (this.action && this.action.styleConfig) {
      osStyle.mergeConfig(this.action.styleConfig, this.styleConfig);
    }

    $scope.$on('color.change', this.onColorChange.bind(this));
    $scope.$on('color.reset', this.onColorReset.bind(this));
    $scope.$on('fillColor.change', this.onFillColorChange.bind(this));
    $scope.$on('fillColor.reset', this.onFillColorReset.bind(this));
    $scope.$on('opacity.slidestop', this.onOpacityChange.bind(this));
    $scope.$on('fillOpacity.slidestop', this.onOpacityChange.bind(this));
    $scope.$on('size.slidestop', this.onSizeChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.LINE_DASH_CHANGE, this.onLineDashChange.bind(this));
    $scope.$on(IconPickerEventType.CHANGE, this.onIconChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.SHAPE_CHANGE, this.onShapeChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, this.onCenterShapeChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.onShowRotationChange_.bind(this));
    $scope.$on(VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.onRotationColumnChange_.bind(this));
    this.initialize();
  }

  /**
   * @inheritDoc
   */
  initialize() {
    if (this.styleConfig) {
      var color = /** @type {Array<number>} */
          (osStyle.getConfigColor(this.styleConfig, true, StyleField.STROKE));

      if (!color) {
        color = osStyle.getConfigColor(this.styleConfig, true);
      }

      if (color) {
        this.scope['color'] = this.initialColor = osColor.toHexString(color);
        if (color.length < 4) {
          color[3] = osStyle.DEFAULT_ALPHA;
        }

        this.scope['opacity'] = color[3];
      } else {
        this.scope['color'] = osColor.toHexString(osStyle.DEFAULT_LAYER_COLOR);
        this.scope['opacity'] = osStyle.DEFAULT_ALPHA;

        color = osColor.toRgbArray(this.scope['color']);
        color[3] = this.scope['opacity'];
      }

      var fill = /** @type {Array<number>} */ (osStyle.getConfigColor(this.styleConfig, true, StyleField.FILL));

      if (fill) {
        this.scope['fillColor'] = osColor.toHexString(fill);

        if (fill.length < 4) {
          fill[3] = osStyle.DEFAULT_FILL_ALPHA;
        }

        this.scope['fillOpacity'] = fill[3];
      } else {
        this.scope['fillColor'] = osColor.toHexString(color || osStyle.DEFAULT_FILL_COLOR);
        this.scope['fillOpacity'] = osStyle.DEFAULT_FILL_ALPHA;

        fill = osColor.toRgbArray(this.scope['fillColor']);
        fill[3] = this.scope['fillOpacity'];
      }

      // Standardize the stroke color
      var strokeColor = osStyle.toRgbaString(color);
      osStyle.setConfigColor(this.styleConfig, strokeColor);

      // If we have a fill color, set that to our style config
      osStyle.setFillColor(this.styleConfig, osStyle.toRgbaString(fill));

      this.scope['size'] = osStyle.getConfigSize(this.styleConfig);
      this.scope['lineDash'] = osStyle.getConfigLineDash(this.styleConfig);

      this.scope['shape'] = this.styleConfig[StyleField.SHAPE] || osStyle.DEFAULT_SHAPE;
      this.updateIcon_();
      this.scope['centerShape'] = this.styleConfig[StyleField.CENTER_SHAPE] || osStyle.DEFAULT_CENTER_SHAPE;
      this.updateCenterIcon_();
      this.scope['showRotation'] = this.styleConfig[StyleField.SHOW_ROTATION] || false;
      this.scope['rotationColumn'] = this.styleConfig[StyleField.ROTATION_COLUMN] || '';

      if (this.type) {
        var dm = DataManager.getInstance();
        var source = dm.getSource(this.type);
        if (instanceOf(source, VectorSource.NAME)) {
          source = /** @type {!VectorSource} */ (source);

          var shapes = googObject.getKeys(osStyle.SHAPES);
          this.scope['shapes'] = googArray.filter(shapes, source.supportsShape, source);
          this.scope['centerShapes'] = googArray.filter(shapes, source.isNotEllipseOrLOBOrDefault, source);
          this.scope['columns'] = layer.getColumnsFromSource(source);

          // autodetect
          if (googString.isEmptyOrWhitespace(this.scope['rotationColumn']) && source.hasColumn(Fields.BEARING)) {
            this.scope['rotationColumn'] = Fields.BEARING;
            this.onRotationColumnChange_(undefined, this.scope['rotationColumn']);
          }
        }
      }
    }

    super.initialize();
  }

  /**
   * @inheritDoc
   */
  saveAction() {
    if (this.action && this.styleConfig) {
      this.action.styleConfig = this.styleConfig;
      // send a message indicating an update occurred
      dispatcher.getInstance().dispatchEvent(EventType.UPDATE);
    }
  }

  /**
   * Handle color change.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {string|undefined} value The new color value.
   * @protected
   */
  onColorChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig) {
      var color = value ? osStyle.toRgbaString(value) : osStyle.DEFAULT_LAYER_COLOR;

      // update the color with the correct opacity
      var colorArr = osColor.toRgbArray(color);
      var opacity = /** @type {number|undefined} */ (this.scope['opacity']);
      if (colorArr && opacity != null) {
        colorArr[3] = opacity;
        color = osStyle.toRgbaString(colorArr);
      }

      // update the fill color with the correct opacity
      var fillColor = value ? osStyle.toRgbaString(value) : osStyle.DEFAULT_FILL_COLOR;
      var fillOpacity = /** @type {number|undefined} */ (this.scope['fillOpacity']);
      var fillColorArr = osColor.toRgbArray(fillColor);
      if (fillColorArr && fillOpacity != null) {
        fillColorArr[3] = fillOpacity;
        fillColor = osStyle.toRgbaString(fillColorArr);
      }

      // Determine if we are changing both stroke and fill entirely, or keeping opacities separate, or only affecting stroke
      var strokeColorHex = osColor.toHexString(this.scope['color']);
      var fillColorHex = osColor.toHexString(this.scope['fillColor']);
      var strokeColorOpacity = this.scope['opacity'];
      var fillColorOpacity = this.scope['fillOpacity'];

      if (strokeColorHex == fillColorHex && strokeColorOpacity == fillColorOpacity) {
        // change both to be the same
        osStyle.setConfigColor(this.styleConfig, color);
        this.scope['color'] = osColor.toHexString(color);
        this.scope['fillColor'] = osColor.toHexString(color);
      } else if (strokeColorHex == fillColorHex) {
        // change the color, but not the opacity, of each one separately
        osStyle.setConfigColor(this.styleConfig, color);
        this.scope['color'] = osColor.toHexString(color);

        // Only change the fill color without changing the image fill color too
        osStyle.setFillColor(this.styleConfig, fillColor);

        this.scope['fillColor'] = osColor.toHexString(fillColor);
      } else {
        // change just the stroke color
        osStyle.setConfigColor(this.styleConfig, color);
        this.scope['color'] = osColor.toHexString(color);
      }
    }
  }

  /**
   * Handle fill color change.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {string|undefined} value The new color value.
   * @protected
   */
  onFillColorChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig) {
      var color = value ? osStyle.toRgbaString(value) : osStyle.DEFAULT_FILL_COLOR;

      // update the color with the correct opacity
      var colorArr = osColor.toRgbArray(color);
      var opacity = /** @type {number|undefined} */ (this.scope['fillOpacity']);
      if (colorArr && opacity != null) {
        colorArr[3] = opacity;
        color = osStyle.toRgbaString(colorArr);
      }

      // Only change the fill color without changing the image fill color too
      osStyle.setFillColor(this.styleConfig, color);

      this.scope['fillColor'] = osColor.toHexString(color);
    }
  }

  /**
   * Handle color reset.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @protected
   */
  onColorReset(event) {
    if (event) {
      event.stopPropagation();
    }

    // reset the color to the initial value
    this.onColorChange(event, this.initialColor);
  }

  /**
   * Handle fill color reset.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @protected
   */
  onFillColorReset(event) {
    if (event) {
      event.stopPropagation();
    }

    // reset the color to the initial value
    this.onFillColorChange(event, osStyle.DEFAULT_FILL_COLOR);
  }

  /**
   * Handle icon change.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {osx.icon.Icon} value The new value.
   * @protected
   */
  onIconChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig && value) {
      osStyle.setConfigIcon(this.styleConfig, value);
    }
  }

  /**
   * Handle changes to opacity.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {number} value
   * @protected
   */
  onOpacityChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    var color;

    if (event.name == 'fillOpacity.slidestop') {
      color = osStyle.getConfigColor(this.styleConfig, true, StyleField.FILL);
      color[3] = value;

      // Only change the fill color without changing the image fill color too
      osStyle.setFillColor(this.styleConfig, color);

      this.scope['fillOpacity'] = value;
    } else {
      var strokeColorHex = osColor.toHexString(this.scope['color']);
      var fillColorHex = osColor.toHexString(this.scope['fillColor']);
      var strokeColorOpacity = this.scope['opacity'];
      var fillColorOpacity = this.scope['fillOpacity'];

      if (strokeColorHex == fillColorHex && strokeColorOpacity == fillColorOpacity) {
        color = osStyle.getConfigColor(this.styleConfig, true);
        color[3] = value;
        osStyle.setConfigColor(this.styleConfig, color);

        this.scope['opacity'] = value;
        this.scope['fillOpacity'] = value;
      } else {
        color = osStyle.getConfigColor(this.styleConfig, true, StyleField.STROKE);
        color[3] = value;

        osStyle.setConfigColor(this.styleConfig, color);

        if (this.scope['fillColor']) {
          osStyle.setFillColor(this.styleConfig, this.styleConfig['fillColor']);
        }

        this.scope['opacity'] = value;
      }
    }
  }

  /**
   * Handle changes to size.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {number} value
   * @protected
   */
  onSizeChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig && value != null) {
      osStyle.setConfigSize(this.styleConfig, value);
    }
  }

  /**
   * Handle changes to line dash.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {Array<number>} value
   * @protected
   */
  onLineDashChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig && value != null) {
      osStyle.setConfigLineDash(this.styleConfig, value);
    }
  }

  /**
   * Handle changes to the shape.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {string} value The new value.
   * @protected
   */
  onShapeChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig) {
      this.styleConfig[StyleField.SHAPE] = value;
    }

    this.updateIcon_();
  }

  /**
   * Handle changes to the shape.
   *
   * @param {?angular.Scope.Event} event The Angular event.
   * @param {string} value The new value.
   * @protected
   */
  onCenterShapeChange(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig) {
      this.styleConfig[StyleField.CENTER_SHAPE] = value;

      // set the center shape image config from the shape picker
      var shape = osStyle.SHAPES[value];
      if (shape) {
        osStyle.mergeConfig(shape['config'], this.styleConfig);
      }
    }

    this.updateCenterIcon_();
  }

  /**
   * Update the displayed icon.
   *
   * @private
   */
  updateIcon_() {
    if (this.styleConfig && this.styleConfig[StyleField.SHAPE] == osStyle.ShapeType.ICON) {
      this.scope['icon'] = osStyle.getConfigIcon(this.styleConfig) || kml.getDefaultIcon();
    } else {
      this.scope['icon'] = null;
    }

    this.onIconChange(null, this.scope['icon']);
  }

  /**
   * Update the displayed icon.
   *
   * @private
   */
  updateCenterIcon_() {
    if (this.styleConfig && this.styleConfig[StyleField.CENTER_SHAPE] == osStyle.ShapeType.ICON) {
      this.scope['centerIcon'] = osStyle.getConfigIcon(this.styleConfig) || kml.getDefaultIcon();
    } else {
      this.scope['centerIcon'] = null;
    }

    this.onIconChange(null, this.scope['centerIcon']);
  }

  /**
   * When to show the icon rotation option
   *
   * @return {boolean}
   * @export
   */
  showRotationOption() {
    if (this.scope != null) {
      var shape = this.scope['shape'] || '';
      var center = this.scope['centerShape'] || '';
      return shape == osStyle.ShapeType.ICON ||
        ((osStyle.ELLIPSE_REGEXP.test(shape) || osStyle.LOB_REGEXP.test(shape)) && center == osStyle.ShapeType.ICON);
    }

    return false;
  }

  /**
   * Handle changes to the Show Rotation option.
   *
   * @param {angular.Scope.Event} event
   * @param {boolean} value
   * @private
   */
  onShowRotationChange_(event, value) {
    if (event) {
      event.stopPropagation();
    }

    if (this.styleConfig) {
      this.styleConfig[StyleField.SHOW_ROTATION] = value;
    }
  }

  /**
   * Handles column changes to the rotation
   *
   * @param {angular.Scope.Event=} opt_event
   * @param {string=} opt_value
   * @private
   */
  onRotationColumnChange_(opt_event, opt_value) {
    if (opt_event) {
      opt_event.stopPropagation();
    }

    if (opt_value && this.styleConfig) {
      this.styleConfig[StyleField.ROTATION_COLUMN] = opt_value;
    }
  }
}
