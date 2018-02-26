goog.provide('os.ui.layer.VectorLayerUICtrl');
goog.provide('os.ui.layer.vectorLayerUIDirective');

goog.require('goog.color');
goog.require('os.command.VectorLayerAutoRefresh');
goog.require('os.command.VectorLayerCenterShape');
goog.require('os.command.VectorLayerColor');
goog.require('os.command.VectorLayerIcon');
goog.require('os.command.VectorLayerLabel');
goog.require('os.command.VectorLayerLabelColor');
goog.require('os.command.VectorLayerLabelSize');
goog.require('os.command.VectorLayerReplaceStyle');
goog.require('os.command.VectorLayerRotation');
goog.require('os.command.VectorLayerShape');
goog.require('os.command.VectorLayerShowLabel');
goog.require('os.command.VectorLayerShowRotation');
goog.require('os.command.VectorLayerSize');
goog.require('os.command.VectorUniqueIdCmd');
goog.require('os.data.OSDataManager');
goog.require('os.defines');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.file.kml');
goog.require('os.ui.icon.IconPickerEventType');
goog.require('os.ui.layer');
goog.require('os.ui.layer.DefaultLayerUICtrl');
goog.require('os.ui.layer.ellipseOptionsDirective');
goog.require('os.ui.layer.iconStyleControlsDirective');
goog.require('os.ui.layer.labelControlsDirective');
goog.require('os.ui.layer.lobOptionsDirective');
goog.require('os.ui.layer.vectorStyleControlsDirective');
goog.require('os.ui.slick.column');
goog.require('os.ui.uiSwitchDirective');


/**
 * The directive for vector layer controls
 * @return {angular.Directive}
 */
os.ui.layer.vectorLayerUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/layer/vector.html',
    controller: os.ui.layer.VectorLayerUICtrl,
    controllerAs: 'vector'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('vectorlayerui', [os.ui.layer.vectorLayerUIDirective]);



/**
 * Controller for the vector layer UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @extends {os.ui.layer.DefaultLayerUICtrl}
 * @ngInject
 */
os.ui.layer.VectorLayerUICtrl = function($scope, $element, $timeout) {
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
   * If the Replace Feature Style option should be displayed.
   * @type {boolean}
   */
  this['showReplaceStyle'] = false;

  /**
   * The Replace Feature Style model.
   * @type {boolean}
   */
  this['replaceStyle'] = false;

  /**
   * Bound function for the uiswitch shape directive.
   * @type {function():string}
   */
  this['getShapeUI'] = this.getShapeUIInternal.bind(this);

  /**
   * The Show Icon Rotation checkbox state.
   * @type {boolean}
   */
  this['showRotation'] = false;

  /**
   * The column used for the rotation
   * @type {string}
   */
  this['rotationColumn'] = '';

  os.ui.layer.VectorLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);
  this.defaultColorControl = os.ui.ColorControlType.PICKER;

  // add events that should trigger a UI update
  this.initEvents.push(os.layer.PropertyChange.LOCK);

  // register scope event listeners

  // style change handlers
  $scope.$on('size.slidestop', this.onSizeChange.bind(this));
  $scope.$on('color.change', this.onColorChange.bind(this));
  $scope.$on('color.reset', this.onColorReset.bind(this));

  $scope.$on(os.ui.icon.IconPickerEventType.CHANGE, this.onIconChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.SHAPE_CHANGE, this.onShapeChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, this.onCenterShapeChange.bind(this));

  // label change handlers
  $scope.$on('labelColor.change', this.onLabelColorChange.bind(this));
  $scope.$on('labelColor.reset', this.onLabelColorReset.bind(this));
  $scope.$on('labelSize.spinstop', this.onLabelSizeChange.bind(this));

  $scope.$on(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE, this.onLabelColumnChange.bind(this));
  $scope.$on(os.ui.layer.LabelControlsEventType.SHOW_LABELS_CHANGE, this.onShowLabelsChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.onShowRotationChange_.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.onRotationColumnChange_.bind(this));
};
goog.inherits(os.ui.layer.VectorLayerUICtrl, os.ui.layer.DefaultLayerUICtrl);


/**
 * @inheritDoc
 */
os.ui.layer.VectorLayerUICtrl.prototype.initUI = function() {
  os.ui.layer.VectorLayerUICtrl.base(this, 'initUI');

  if (this.scope) {
    this.scope['color'] = this.getColor_();
    this.scope['size'] = this.getSize_();
    this.scope['icon'] = this.getIcon_();
    this.scope['centerIcon'] = this.getCenterIcon_();
    this.scope['shape'] = this.getShape_();
    this.scope['shapes'] = this.getShapes_();
    this.scope['centerShape'] = this.getCenterShape_();
    this.scope['centerShapes'] = this.getCenterShapes_();
    this.scope['lockable'] = this.getLockable_();
    this.scope['altitude'] = this.getAltitudeEnabled_();
    this['columns'] = this.getValue(os.ui.layer.getColumns);
    this['showRotation'] = this.getShowRotation_();
    this['rotationColumn'] = this.getRotationColumn_();
    if (goog.string.isEmpty(this['rotationColumn']) && this.canUseBearing()) { // try to autodetect bearing if undefined
      this['rotationColumn'] = os.Fields.BEARING;
      this.onRotationColumnChange(this['rotationColumn']);
    }


    this.updateReplaceStyle_();

    if (this.scope['items'] && this.scope['items'].length == 1) {
      // NOTE: This initUI method can get called a-lot, depending on some events that get routed to this method.
      this.scope['columns'] = this.getValue(os.ui.layer.getColumns);
      this['uniqueId'] = this.getValue(os.ui.layer.getUniqueId);

      this.reconcileLabelsState_();

      if (this.scope['showLabels'] !== this.getValue(os.ui.layer.getShowLabel)) {
        this.scope['showLabels'] = this.getValue(os.ui.layer.getShowLabel);
      }

      if (this.scope['labelColor'] !== this.getValue(os.ui.layer.getLabelColor)) {
        this.scope['labelColor'] = this.getValue(os.ui.layer.getLabelColor);
      }

      if (this.scope['labelSize'] !== this.getValue(os.ui.layer.getLabelSize) ||
          this.scope['labelSize'] !== os.style.label.DEFAULT_SIZE) {
        this.scope['labelSize'] = this.getValue(os.ui.layer.getLabelSize) || os.style.label.DEFAULT_SIZE;
      }
    } else {
      this.scope['columns'] = null;
      this.scope['column'] = null;
      this.scope['showLabels'] = false;
      this.scope['labelColor'] = '';
      this.scope['labelSize'] = 0;
    }

    // update the shape UI
    this.scope.$broadcast(os.ui.UISwitchEventType.UPDATE);
  }
};


/**
 * Get the shape-specific configuration UI.
 * @return {string|undefined}
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShapeUIInternal = function() {
  if (this.scope != null) {
    var shape = this.scope['shape'] || '';
    if (os.style.ELLIPSE_REGEXP.test(shape)) {
      return 'ellipseoptions';
    } else if (os.style.LOB_REGEXP.test(shape)) {
      return 'loboptions';
    }
  }

  return undefined;
};


/**
 * Decide when to show the rotation option
 * @return {boolean}
 */
os.ui.layer.VectorLayerUICtrl.prototype.showRotationOption = function() {
  if (this.scope != null) {
    var shape = this.scope['shape'] || '';
    var centr = this.scope['centerShape'] || '';
    return shape == os.style.ShapeType.ICON || (os.style.CENTER_REGEXP.test(shape) && centr == os.style.ShapeType.ICON);
  }

  return false;
};
goog.exportProperty(
    os.ui.layer.VectorLayerUICtrl.prototype,
    'showRotationOption',
    os.ui.layer.VectorLayerUICtrl.prototype.showRotationOption);


/**
 * Synchronizes the scope labels.
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.reconcileLabelsState_ = function() {
  // Duplicate the labels so the command stack undo/redo works
  var labels = this.getValue(os.ui.layer.getColumn, []);

  // the UI modifies the label config objects, so they must be cloned or undo/redo will not work.
  var clone = [];
  goog.array.forEach(labels, function(label) {
    clone.push(os.style.label.cloneConfig(label));
  }, this);

  // If empty, add placeholder
  if (clone.length === 0) {
    clone.push(os.style.label.cloneConfig());
  }

  this.scope['labels'] = clone;
};


/**
 * Handles changes to color
 * @param {angular.Scope.Event} event
 * @param {string} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onColorChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerColor(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles color reset
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onColorReset = function(event) {
  event.stopPropagation();

  // clear the layer color config value
  this.onColorChange(event, '');

  // reset to the layer color
  this.scope['color'] = this.getColor_();
};


/**
 * Handles changes to size
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onSizeChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerSize(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles changes to the icon.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {osx.icon.Icon} value The new value.
 */
os.ui.layer.VectorLayerUICtrl.prototype.onIconChange = function(event, value) {
  event.stopPropagation();

  if (value) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerIcon(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(os.ui.layer.VectorLayerUICtrl.prototype, 'onIconChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onIconChange);


/**
 * Handles changes to the shape.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {string} value The new value.
 */
os.ui.layer.VectorLayerUICtrl.prototype.onShapeChange = function(event, value) {
  event.stopPropagation();
  if (value) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShape(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(os.ui.layer.VectorLayerUICtrl.prototype, 'onShapeChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onShapeChange);


/**
 * Handles changes to the center shape.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {string} value The new value.
 */
os.ui.layer.VectorLayerUICtrl.prototype.onCenterShapeChange = function(event, value) {
  event.stopPropagation();
  if (value) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerCenterShape(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(os.ui.layer.VectorLayerUICtrl.prototype, 'onCenterShapeChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onCenterShapeChange);


/**
 * Handles changes to label color
 * @param {angular.Scope.Event} event
 * @param {string} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLabelColorChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLabelColor(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles label color reset
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLabelColorReset = function(event) {
  event.stopPropagation();

  // reset to the layer color
  var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var layer = items[0].getLayer();
    if (layer) {
      var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
      this.scope['labelColor'] = os.style.getConfigColor(layerConfig);
    }
  }

  // clear the label color config value
  this.onLabelColorChange(event, '');
};


/**
 * Handles changes to size
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLabelSizeChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLabelSize(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles column changes
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLabelColumnChange = function(event) {
  event.stopPropagation();

  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length === 1) {
    var fn = goog.bind(
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerLabel(layer.getId(), this.scope['labels']);
        }, this);

    this.createCommand(fn);
  }
};


/**
 * Handles changes to the show labels checkbox.
 * @param {angular.Scope.Event} event
 * @param {boolean} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onShowLabelsChange = function(event, value) {
  event.stopPropagation();

  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length === 1) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowLabel(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};


/**
 * Gets the color from the item(s)
 * @return {?string} a hex color string
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getColor_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = items[i].getLayer();

        if (layer) {
          var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            var color = /** @type {Array<number>} */ (os.style.getConfigColor(config, true));
            return color ? goog.color.rgbArrayToHex(color) : color;
          }
        }
      } catch (e) {
      }
    }
  }

  return null;
};


/**
 * Gets the size from the item(s)
 * @return {number} The size
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getSize_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var size;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = items[i].getLayer();

        if (layer) {
          var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            size = os.style.getConfigSize(config);
          }
        }
      } catch (e) {
      }
    }
  }

  return size || os.style.DEFAULT_FEATURE_SIZE;
};


/**
 * Gets the icon from the item(s).
 * @return {?osx.icon.Icon} The icon.
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getIcon_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var icon = null;

  if (items && items.length > 0) {
    try {
      var source = os.data.DataManager.getInstance().getSource(items[0].getId());
      if (source && source.getGeometryShape() == os.style.ShapeType.ICON) {
        var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
        icon = os.style.getConfigIcon(config) || os.ui.file.kml.getDefaultIcon();
      }
    } catch (e) {
    }
  }

  return icon;
};


/**
 * Gets the icon from the item(s).
 * @return {?osx.icon.Icon} The icon.
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getCenterIcon_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var icon = null;

  if (items && items.length > 0) {
    try {
      var source = os.data.DataManager.getInstance().getSource(items[0].getId());
      if (source && source.getCenterGeometryShape() == os.style.ShapeType.ICON) {
        var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
        icon = os.style.getConfigIcon(config) || os.ui.file.kml.getDefaultIcon();
      }
    } catch (e) {
    }
  }

  return icon;
};


/**
 * Gets the shape from the item(s)
 * @return {string} The shape
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShape_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shape;

  if (items && items.length > 0) {
    try {
      var source = os.osDataManager.getSource(items[0].getId());
      if (source) {
        shape = source.getGeometryShape();
      }
    } catch (e) {
    }
  }

  return shape || os.style.DEFAULT_SHAPE;
};


/**
 * Gets the shape options that apply to the item(s)
 * @return {Array<string>} The available shape options
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShapes_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shapes = goog.object.getKeys(os.style.SHAPES);

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var source = os.osDataManager.getSource(items[i].getId());
        if (source && source instanceof os.source.Vector) {
          shapes = goog.array.filter(shapes, source.supportsShape, source);
        }
      } catch (e) {
      }
    }
  }

  return shapes;
};


/**
 * Gets the shape from the item(s)
 * @return {string} The shape
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getCenterShape_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shape;

  if (items && items.length > 0) {
    try {
      var source = os.osDataManager.getSource(items[0].getId());
      if (source) {
        var tempShape = source.getCenterGeometryShape();
        if (!os.style.ELLIPSE_REGEXP.test(tempShape) && !os.style.DEFAULT_REGEXP.test(tempShape)) {
          shape = tempShape;
        }
      }
    } catch (e) {
    }
  }

  return shape || os.style.DEFAULT_CENTER_SHAPE;
};


/**
 * Gets the shape options that apply to the item(s)
 * @return {Array<string>} The available shape options
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getCenterShapes_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shapes = goog.object.getKeys(os.style.SHAPES);

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var source = os.osDataManager.getSource(items[i].getId());
        if (source && source instanceof os.source.Vector) {
          shapes = goog.array.filter(shapes, source.isNotEllipseOrLOBOrDefault, source);
        }
      } catch (e) {
      }
    }
  }

  return shapes;
};


/**
 * Updates the locked state on the UI.
 * @return {boolean} are all the items locable
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getLockable_ = function() {
  this['lock'] = false;
  // Only display lock option if all sources are lockable
  var lockable = true;
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var source = os.osDataManager.getSource(items[i].getId());
        if (source && source instanceof os.source.Vector && !source.isLockable()) {
          lockable = false;
          break;
        } else {
          this['lock'] = source.isLocked();
        }
      } catch (e) {
        lockable = false;
      }
    }
  }
  return lockable;
};


/**
 * Set the locked state of the source
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLockChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var source = os.osDataManager.getSource(items[i].getId());
        if (source && source instanceof os.source.Vector && source.isLockable()) {
          source.setLocked(this['lock']);
        }
      } catch (e) {
      }
    }
  }
};
goog.exportProperty(
    os.ui.layer.VectorLayerUICtrl.prototype,
    'onLockChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onLockChange);


/**
 * Updates the Replace Feature Style state on the UI.
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.updateReplaceStyle_ = function() {
  this['showReplaceStyle'] = false;
  this['replaceStyle'] = false;

  var nodes = this.getLayerNodes();
  if (nodes && nodes.length > 0) {
    var replaceStyle;

    // only show refresh options if all sources support it
    this['showReplaceStyle'] = goog.array.every(nodes, function(node) {
      var layer = node.getLayer();
      if (os.implements(layer, os.layer.ILayer.ID)) {
        var options = layer.getLayerOptions();
        if (options && options[os.layer.LayerOption.SHOW_FORCE_COLOR]) {
          if (replaceStyle == null) {
            var config = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
            if (config) {
              replaceStyle = !!config[os.style.StyleField.REPLACE_STYLE];
            }
          }

          return true;
        }
      }

      return false;
    });

    if (replaceStyle != null) {
      this['replaceStyle'] = replaceStyle;
    }
  }
};


/**
 * Handle changes to the Replace Feature Style option.
 */
os.ui.layer.VectorLayerUICtrl.prototype.onReplaceStyleChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var value = this['replaceStyle'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerReplaceStyle(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.VectorLayerUICtrl.prototype,
    'onReplaceStyleChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onReplaceStyleChange);


/**
 * @return {boolean}
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getAltitudeEnabled_ = function() {
  var altitudeEnabled = true;
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var source = os.osDataManager.getSource(items[i].getId());
        if (source && source instanceof os.source.Vector) {
          altitudeEnabled = source.hasAltitudeEnabled();
          break;
        }
      } catch (e) {
      }
    }
  }
  return altitudeEnabled;
};


/**
 * Set the locked state of the source
 */
os.ui.layer.VectorLayerUICtrl.prototype.onAltitudeChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var source = os.osDataManager.getSource(items[i].getId());
        if (source && source instanceof os.source.Vector) {
          source.setAltitudeEnabled(this.scope['altitude']);
        }
      } catch (e) {
      }
    }
  }
};
goog.exportProperty(
    os.ui.layer.VectorLayerUICtrl.prototype,
    'onAltitudeChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onAltitudeChange);


/**
 * Set the unique ID field of the source.
 */
os.ui.layer.VectorLayerUICtrl.prototype.onUniqueIdChange = function() {
  var nodes = this.getLayerNodes();
  if (nodes && nodes.length > 0) {
    var uniqueId = /** @type {os.data.ColumnDefinition} */ (this['uniqueId']);
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorUniqueIdCmd(layer.getId(), uniqueId);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.VectorLayerUICtrl.prototype,
    'onUniqueIdChange',
    os.ui.layer.VectorLayerUICtrl.prototype.onUniqueIdChange);


/**
 * Fall back to auto-detected bearing
 * @return {boolean}
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.canUseBearing = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var layer = items[0].getLayer();
  if (layer) {
    var source = /** @type {os.layer.Vector} */ (layer).getSource();
    if (source && os.instanceOf(source, os.source.Vector.NAME)) {
      source = /** @type {!os.source.Vector} */ (source);
      if (!source.hasColumn(os.Fields.BEARING)) {
        return false;
      }
      return true;
    }
  }
  return false;
};



/**
 * The column for the icon rotation
 * @return {string}
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getRotationColumn_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.ROTATION_COLUMN];
    }
  }

  return '';
};


/**
 * If arrow should be displayed for the layer(s).
 * @return {boolean}
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShowRotation_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return !!config[os.style.StyleField.SHOW_ROTATION];
    }
  }

  return false;
};


/**
 * Handle changes to the Show Rotation option.
 * @param {angular.Scope.Event} event
 * @param {boolean} value
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.onShowRotationChange_ = function(event, value) {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowRotation(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};


/**
 * Handles column changes to the rotation
 * @param {angular.Scope.Event} event
 * @param {string} value
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.onRotationColumnChange_ = function(event, value) {
  this.onRotationColumnChange(value);
};


/**
 * Notify column changes to the rotation
 * @param {string} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onRotationColumnChange = function(value) {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var fn = goog.bind(
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerRotation(layer.getId(), value);
        }, this);

    this.createCommand(fn);
  }
};
