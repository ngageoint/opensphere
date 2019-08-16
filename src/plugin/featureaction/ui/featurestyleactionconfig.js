goog.provide('plugin.im.action.feature.ui.StyleConfigCtrl');
goog.provide('plugin.im.action.feature.ui.styleConfigDirective');

goog.require('goog.color');
goog.require('os.color');
goog.require('os.object');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.file.kml');
goog.require('os.ui.icon.IconPickerEventType');
goog.require('os.ui.im.action.EventType');
goog.require('os.ui.layer.iconStyleControlsDirective');
goog.require('os.ui.layer.vectorStyleControlsDirective');
goog.require('os.ui.uiSwitchDirective');
goog.require('plugin.im.action.feature.StyleAction');
goog.require('plugin.im.action.feature.ui.ActionConfigCtrl');


/**
 * Directive to configure a feature style action.
 *
 * @return {angular.Directive}
 */
plugin.im.action.feature.ui.styleConfigDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<div><vectorstylecontrols color="color" opacity="opacity" size="size" line-dash="lineDash"' +
        'icon="icon" center-icon="centerIcon" icon-set="ctrl.iconSet" icon-src="ctrl.iconSrc" ' +
        'shape="shape" shapes="shapes" center-shape="centerShape" center-shapes="centerShapes" ' +
        'show-color-reset="true" fill-color="fillColor" fill-opacity="fillOpacity"></vectorstylecontrols>' +
        '<iconstylecontrols ng-show="ctrl.showRotationOption()" columns="columns" show-rotation="showRotation" ' +
        'rotation-column="rotationColumn"></iconstylecontrols></div>',
    controller: plugin.im.action.feature.ui.StyleConfigCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive(plugin.im.action.feature.StyleAction.CONFIG_UI,
    [plugin.im.action.feature.ui.styleConfigDirective]);



/**
 * Controller for setting a feature style.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {plugin.im.action.feature.ui.ActionConfigCtrl<plugin.im.action.feature.StyleAction>}
 * @constructor
 * @ngInject
 */
plugin.im.action.feature.ui.StyleConfigCtrl = function($scope, $element) {
  plugin.im.action.feature.ui.StyleConfigCtrl.base(this, 'constructor', $scope, $element);

  /**
   * Icons available to the icon picker.
   * @type {!Array<!osx.icon.Icon>}
   */
  this['iconSet'] = os.ui.file.kml.GOOGLE_EARTH_ICON_SET;

  /**
   * Function to translate image sources from the icon set.
   * @type {function(string):string}
   */
  this['iconSrc'] = os.ui.file.kml.replaceGoogleUri;

  /**
   * The action style config.
   * @type {Object}
   * @protected
   */
  this.styleConfig = /** @type {!Object} */ (os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG));

  /**
   * The original style color, for the Reset button.
   * @type {string|undefined}
   * @protected
   */
  this.initialColor = undefined;

  if (this.action && this.action.styleConfig) {
    os.style.mergeConfig(this.action.styleConfig, this.styleConfig);
  }

  $scope.$on('color.change', this.onColorChange.bind(this));
  $scope.$on('color.reset', this.onColorReset.bind(this));
  $scope.$on('fillColor.change', this.onFillColorChange.bind(this));
  $scope.$on('fillColor.reset', this.onFillColorReset.bind(this));
  $scope.$on('opacity.slidestop', this.onOpacityChange.bind(this));
  $scope.$on('fillOpacity.slidestop', this.onOpacityChange.bind(this));
  $scope.$on('size.slidestop', this.onSizeChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.LINE_DASH_CHANGE, this.onLineDashChange.bind(this));
  $scope.$on(os.ui.icon.IconPickerEventType.CHANGE, this.onIconChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.SHAPE_CHANGE, this.onShapeChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, this.onCenterShapeChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.onShowRotationChange_.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.onRotationColumnChange_.bind(this));
  this.initialize();
};
goog.inherits(plugin.im.action.feature.ui.StyleConfigCtrl, plugin.im.action.feature.ui.ActionConfigCtrl);


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.initialize = function() {
  if (this.styleConfig) {
    var color = /** @type {Array<number>} */
        (os.style.getConfigColor(this.styleConfig, true, os.style.StyleField.STROKE));

    if (!color) {
      color = os.style.getConfigColor(this.styleConfig, true);
    }

    if (color) {
      this.scope['color'] = this.initialColor = os.color.toHexString(color);
      if (color.length < 4) {
        color[3] = os.style.DEFAULT_ALPHA;
      }

      this.scope['opacity'] = color[3];
    } else {
      this.scope['color'] = os.color.toHexString(os.style.DEFAULT_LAYER_COLOR);
      this.scope['opacity'] = os.style.DEFAULT_ALPHA;

      color = os.color.toRgbArray(this.scope['color']);
      color[3] = this.scope['opacity'];
    }

    var fill = /** @type {Array<number>} */ (os.style.getConfigColor(this.styleConfig, true, os.style.StyleField.FILL));

    if (fill) {
      this.scope['fillColor'] = os.color.toHexString(fill);

      if (fill.length < 4) {
        fill[3] = os.style.DEFAULT_FILL_ALPHA;
      }

      this.scope['fillOpacity'] = fill[3];
    } else {
      this.scope['fillColor'] = os.color.toHexString(color || os.style.DEFAULT_FILL_COLOR);
      this.scope['fillOpacity'] = os.style.DEFAULT_FILL_ALPHA;

      fill = os.color.toRgbArray(this.scope['fillColor']);
      fill[3] = this.scope['fillOpacity'];
    }

    // Standardize the stroke color
    var strokeColor = os.style.toRgbaString(color);
    os.style.setConfigColor(this.styleConfig, strokeColor);

    // If we have a fill color, set that to our style config
    os.style.setFillColor(this.styleConfig, os.style.toRgbaString(fill));

    this.scope['size'] = os.style.getConfigSize(this.styleConfig);
    this.scope['lineDash'] = os.style.getConfigLineDash(this.styleConfig);

    this.scope['shape'] = this.styleConfig[os.style.StyleField.SHAPE] || os.style.DEFAULT_SHAPE;
    this.updateIcon_();
    this.scope['centerShape'] = this.styleConfig[os.style.StyleField.CENTER_SHAPE] || os.style.DEFAULT_CENTER_SHAPE;
    this.updateCenterIcon_();
    this.scope['showRotation'] = this.styleConfig[os.style.StyleField.SHOW_ROTATION] || false;
    this.scope['rotationColumn'] = this.styleConfig[os.style.StyleField.ROTATION_COLUMN] || '';

    if (this.type) {
      var dm = os.data.DataManager.getInstance();
      var source = dm.getSource(this.type);
      if (os.instanceOf(source, os.source.Vector.NAME)) {
        source = /** @type {!os.source.Vector} */ (source);

        var shapes = goog.object.getKeys(os.style.SHAPES);
        this.scope['shapes'] = goog.array.filter(shapes, source.supportsShape, source);
        this.scope['centerShapes'] = goog.array.filter(shapes, source.isNotEllipseOrLOBOrDefault, source);
        this.scope['columns'] = os.ui.layer.getColumnsFromSource(source);

        // autodetect
        if (goog.string.isEmptyOrWhitespace(this.scope['rotationColumn']) && source.hasColumn(os.Fields.BEARING)) {
          this.scope['rotationColumn'] = os.Fields.BEARING;
          this.onRotationColumnChange_(undefined, this.scope['rotationColumn']);
        }
      }
    }
  }

  plugin.im.action.feature.ui.StyleConfigCtrl.base(this, 'initialize');
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.saveAction = function() {
  if (this.action && this.styleConfig) {
    this.action.styleConfig = this.styleConfig;
    // send a message indicating an update occurred
    os.dispatcher.dispatchEvent(os.ui.im.action.EventType.UPDATE);
  }
};


/**
 * Handle color change.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {string|undefined} value The new color value.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onColorChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig) {
    var color = value ? os.style.toRgbaString(value) : os.style.DEFAULT_LAYER_COLOR;

    // update the color with the correct opacity
    var colorArr = os.color.toRgbArray(color);
    var opacity = /** @type {number|undefined} */ (this.scope['opacity']);
    if (colorArr && opacity != null) {
      colorArr[3] = opacity;
      color = os.style.toRgbaString(colorArr);
    }

    // update the fill color with the correct opacity
    var fillColor = value ? os.style.toRgbaString(value) : os.style.DEFAULT_FILL_COLOR;
    var fillOpacity = /** @type {number|undefined} */ (this.scope['fillOpacity']);
    var fillColorArr = os.color.toRgbArray(fillColor);
    if (fillColorArr && fillOpacity != null) {
      fillColorArr[3] = fillOpacity;
      fillColor = os.style.toRgbaString(fillColorArr);
    }

    // Determine if we are changing both stroke and fill entirely, or keeping opacities separate, or only affecting stroke
    var strokeColorHex = os.color.toHexString(this.scope['color']);
    var fillColorHex = os.color.toHexString(this.scope['fillColor']);
    var strokeColorOpacity = this.scope['opacity'];
    var fillColorOpacity = this.scope['fillOpacity'];

    if (strokeColorHex == fillColorHex && strokeColorOpacity == fillColorOpacity) {
      // change both to be the same
      os.style.setConfigColor(this.styleConfig, color);
      this.scope['color'] = os.color.toHexString(color);
      this.scope['fillColor'] = os.color.toHexString(color);
    } else if (strokeColorHex == fillColorHex) {
      // change the color, but not the opacity, of each one separately
      os.style.setConfigColor(this.styleConfig, color);
      this.scope['color'] = os.color.toHexString(color);

      // Only change the fill color without changing the image fill color too
      os.style.setFillColor(this.styleConfig, fillColor);

      this.scope['fillColor'] = os.color.toHexString(fillColor);
    } else {
      // change just the stroke color
      os.style.setConfigColor(this.styleConfig, color);
      this.scope['color'] = os.color.toHexString(color);
    }
  }
};


/**
 * Handle fill color change.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {string|undefined} value The new color value.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onFillColorChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig) {
    var color = value ? os.style.toRgbaString(value) : os.style.DEFAULT_FILL_COLOR;

    // update the color with the correct opacity
    var colorArr = os.color.toRgbArray(color);
    var opacity = /** @type {number|undefined} */ (this.scope['fillOpacity']);
    if (colorArr && opacity != null) {
      colorArr[3] = opacity;
      color = os.style.toRgbaString(colorArr);
    }

    // Only change the fill color without changing the image fill color too
    os.style.setFillColor(this.styleConfig, color);

    this.scope['fillColor'] = os.color.toHexString(color);
  }
};


/**
 * Handle color reset.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onColorReset = function(event) {
  if (event) {
    event.stopPropagation();
  }

  // reset the color to the initial value
  this.onColorChange(event, this.initialColor);
};


/**
 * Handle fill color reset.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onFillColorReset = function(event) {
  if (event) {
    event.stopPropagation();
  }

  // reset the color to the initial value
  this.onFillColorChange(event, os.style.DEFAULT_FILL_COLOR);
};


/**
 * Handle icon change.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {osx.icon.Icon} value The new value.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onIconChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig && value) {
    os.style.setConfigIcon(this.styleConfig, value);
  }
};


/**
 * Handle changes to opacity.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {number} value
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onOpacityChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  var color;

  if (event.name == 'fillOpacity.slidestop') {
    color = os.style.getConfigColor(this.styleConfig, true, os.style.StyleField.FILL);
    color[3] = value;

    // Only change the fill color without changing the image fill color too
    os.style.setFillColor(this.styleConfig, color);

    this.scope['fillOpacity'] = value;
  } else {
    var strokeColorHex = os.color.toHexString(this.scope['color']);
    var fillColorHex = os.color.toHexString(this.scope['fillColor']);
    var strokeColorOpacity = this.scope['opacity'];
    var fillColorOpacity = this.scope['fillOpacity'];

    if (strokeColorHex == fillColorHex && strokeColorOpacity == fillColorOpacity) {
      color = os.style.getConfigColor(this.styleConfig, true);
      color[3] = value;
      os.style.setConfigColor(this.styleConfig, color);

      this.scope['opacity'] = value;
      this.scope['fillOpacity'] = value;
    } else {
      color = os.style.getConfigColor(this.styleConfig, true, os.style.StyleField.STROKE);
      color[3] = value;

      os.style.setConfigColor(this.styleConfig, color);

      if (this.scope['fillColor']) {
        os.style.setFillColor(this.styleConfig, this.styleConfig['fillColor']);
      }

      this.scope['opacity'] = value;
    }
  }
};


/**
 * Handle changes to size.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {number} value
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onSizeChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig && value != null) {
    os.style.setConfigSize(this.styleConfig, value);
  }
};


/**
 * Handle changes to line dash.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {Array<number>} value
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onLineDashChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig && value != null) {
    os.style.setConfigLineDash(this.styleConfig, value);
  }
};


/**
 * Handle changes to the shape.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {string} value The new value.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onShapeChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig) {
    this.styleConfig[os.style.StyleField.SHAPE] = value;
  }

  this.updateIcon_();
};


/**
 * Handle changes to the shape.
 *
 * @param {?angular.Scope.Event} event The Angular event.
 * @param {string} value The new value.
 * @protected
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onCenterShapeChange = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig) {
    this.styleConfig[os.style.StyleField.CENTER_SHAPE] = value;
  }

  this.updateCenterIcon_();
};


/**
 * Update the displayed icon.
 *
 * @private
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.updateIcon_ = function() {
  if (this.styleConfig && this.styleConfig[os.style.StyleField.SHAPE] == os.style.ShapeType.ICON) {
    this.scope['icon'] = os.style.getConfigIcon(this.styleConfig) || os.ui.file.kml.getDefaultIcon();
  } else {
    this.scope['icon'] = null;
  }

  this.onIconChange(null, this.scope['icon']);
};


/**
 * Update the displayed icon.
 *
 * @private
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.updateCenterIcon_ = function() {
  if (this.styleConfig && this.styleConfig[os.style.StyleField.CENTER_SHAPE] == os.style.ShapeType.ICON) {
    this.scope['centerIcon'] = os.style.getConfigIcon(this.styleConfig) || os.ui.file.kml.getDefaultIcon();
  } else {
    this.scope['centerIcon'] = null;
  }

  this.onIconChange(null, this.scope['centerIcon']);
};


/**
 * When to show the icon rotation option
 *
 * @return {boolean}
 * @export
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.showRotationOption = function() {
  if (this.scope != null) {
    var shape = this.scope['shape'] || '';
    var center = this.scope['centerShape'] || '';
    return shape == os.style.ShapeType.ICON ||
      ((os.style.ELLIPSE_REGEXP.test(shape) || os.style.LOB_REGEXP.test(shape)) && center == os.style.ShapeType.ICON);
  }

  return false;
};


/**
 * Handle changes to the Show Rotation option.
 *
 * @param {angular.Scope.Event} event
 * @param {boolean} value
 * @private
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onShowRotationChange_ = function(event, value) {
  if (event) {
    event.stopPropagation();
  }

  if (this.styleConfig) {
    this.styleConfig[os.style.StyleField.SHOW_ROTATION] = value;
  }
};


/**
 * Handles column changes to the rotation
 *
 * @param {angular.Scope.Event=} opt_event
 * @param {string=} opt_value
 * @private
 */
plugin.im.action.feature.ui.StyleConfigCtrl.prototype.onRotationColumnChange_ = function(opt_event, opt_value) {
  if (opt_event) {
    opt_event.stopPropagation();
  }

  if (opt_value && this.styleConfig) {
    this.styleConfig[os.style.StyleField.ROTATION_COLUMN] = opt_value;
  }
};
