goog.provide('os.ui.layer.VectorLayerUICtrl');
goog.provide('os.ui.layer.vectorLayerUIDirective');

goog.require('goog.color');
goog.require('os.MapChange');
goog.require('os.array');
goog.require('os.command.VectorLayerAutoRefresh');
goog.require('os.command.VectorLayerCenterShape');
goog.require('os.command.VectorLayerColor');
goog.require('os.command.VectorLayerIcon');
goog.require('os.command.VectorLayerLabel');
goog.require('os.command.VectorLayerLabelColor');
goog.require('os.command.VectorLayerLabelSize');
goog.require('os.command.VectorLayerLineDash');
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
goog.require('os.webgl');


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

  /**
   * The altitude modes supported
   * @type {Array<os.webgl.AltitudeMode>}
   */
  this['altitudeModes'] = [];

  /**
   * If the altitude modes should be shown
   * @type {boolean}
   */
  this['showAltitudeModes'] = false;

  os.ui.layer.VectorLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);
  this.defaultColorControl = os.ui.ColorControlType.PICKER;

  // add events that should trigger a UI update
  this.initEvents.push(os.layer.PropertyChange.LOCK);

  // register scope event listeners
  os.map.mapContainer.listen(goog.events.EventType.PROPERTYCHANGE, this.onMapView3DChange_, false, this);

  // style change handlers
  $scope.$on('size.slidestop', this.onSizeChange.bind(this));
  $scope.$on('color.change', this.onColorChange.bind(this));
  $scope.$on('color.reset', this.onColorReset.bind(this));

  $scope.$on(os.ui.icon.IconPickerEventType.CHANGE, this.onIconChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.SHAPE_CHANGE, this.onShapeChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, this.onCenterShapeChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.LINE_DASH_CHANGE, this.onLineDashChange.bind(this));

  // label change handlers
  $scope.$on('labelColor.change', this.onLabelColorChange.bind(this));
  $scope.$on('labelColor.reset', this.onLabelColorReset.bind(this));
  $scope.$on('labelSize.spinstop', this.onLabelSizeChange.bind(this));

  $scope.$on(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE, this.onLabelColumnChange.bind(this));
  $scope.$on(os.ui.layer.LabelControlsEventType.SHOW_LABELS_CHANGE, this.onShowLabelsChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.onShowRotationChange.bind(this));
  $scope.$on(os.ui.layer.VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.onRotationColumnChange.bind(this));
};
goog.inherits(os.ui.layer.VectorLayerUICtrl, os.ui.layer.DefaultLayerUICtrl);


/**
 * @inheritDoc
 */
os.ui.layer.VectorLayerUICtrl.prototype.initUI = function() {
  os.ui.layer.VectorLayerUICtrl.base(this, 'initUI');

  if (this.scope) {
    this.scope['color'] = this.getColor();
    this.scope['size'] = this.getSize();
    this.scope['lineDash'] = this.getLineDash();
    this.scope['icon'] = this.getIcon();
    this.scope['centerIcon'] = this.getCenterIcon();
    this.scope['shape'] = this.getShape();
    this.scope['shapes'] = this.getShapes();
    this.scope['centerShape'] = this.getCenterShape();
    this.scope['centerShapes'] = this.getCenterShapes();
    this.scope['lockable'] = this.getLockable();
    this['altitudeMode'] = this.getAltitudeMode();
    this['columns'] = this.getColumns();
    this['showRotation'] = this.getShowRotation();
    this['rotationColumn'] = this.getRotationColumn();

    this.updateReplaceStyle_();

    if (this.scope['items'] && this.scope['items'].length == 1) {
      // NOTE: This initUI method can get called a-lot, depending on some events that get routed to this method.
      this.scope['columns'] = this.getColumns();
      this['uniqueId'] = this.getUniqueId();

      this.reconcileLabelsState_();

      if (this.scope['showLabels'] !== this.getShowLabel()) {
        this.scope['showLabels'] = this.getShowLabel();
      }

      if (this.scope['labelColor'] !== this.getLabelColor()) {
        this.scope['labelColor'] = this.getLabelColor();
      }

      if (this.scope['labelSize'] !== this.getLabelSize() ||
          this.scope['labelSize'] !== os.style.label.DEFAULT_SIZE) {
        this.scope['labelSize'] = this.getLabelSize() || os.style.label.DEFAULT_SIZE;
      }
    } else {
      this.scope['columns'] = null;
      this.scope['column'] = null;
      this.scope['showLabels'] = false;
      this.scope['labelColor'] = '';
      this.scope['labelSize'] = 0;
    }

    var webGLRenderer = os.map.mapContainer.getWebGLRenderer();
    if (webGLRenderer) {
      this['altitudeModes'] = webGLRenderer.getAltitudeModes();
      this['showAltitudeModes'] = this['altitudeModes'].length > 0 && os.map.mapContainer.is3DEnabled();
    }

    // update the shape UI
    this.scope.$broadcast(os.ui.UISwitchEventType.UPDATE);
  }
};


/**
 * Get the shape-specific configuration UI.
 * @return {string|undefined}
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
 * @export
 */
os.ui.layer.VectorLayerUICtrl.prototype.showRotationOption = function() {
  if (this.scope != null) {
    var shape = this.scope['shape'] || '';
    var centr = this.scope['centerShape'] || '';
    return shape == os.style.ShapeType.ICON || (os.style.CENTER_REGEXP.test(shape) && centr == os.style.ShapeType.ICON);
  }

  return false;
};


/**
 * Synchronizes the scope labels.
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.reconcileLabelsState_ = function() {
  // Duplicate the labels so the command stack undo/redo works
  var labels = this.getColumn();

  // the UI modifies the label config objects, so they must be cloned or undo/redo will not work.
  var clone = [];
  os.array.forEach(labels, function(label) {
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
  this.scope['color'] = this.getColor();
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
 * Handles changes to line dash
 * @param {angular.Scope.Event} event
 * @param {Array<number>} value
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLineDashChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLineDash(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles changes to the icon.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {osx.icon.Icon} value The new value.
 * @export
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


/**
 * Handles changes to the shape.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {string} value The new value.
 * @export
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


/**
 * Handles changes to the center shape.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {string} value The new value.
 * @export
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
  this.scope['labelColor'] = this.getLabelColor();

  // clear the label color config value
  this.onLabelColorChange(event, '');
};


/**
 * Handles changes to label size
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
 * @protected
 */
os.ui.layer.VectorLayerUICtrl.prototype.getColor = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var layer = items[i].getLayer();

      if (layer) {
        var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());

        if (config) {
          var color = /** @type {Array<number>} */ (os.style.getConfigColor(config, true));
          return color ? goog.color.rgbArrayToHex(color) : color;
        }
      }
    }
  }

  return null;
};


/**
 * Gets the size from the item(s)
 * @return {number} The size
 */
os.ui.layer.VectorLayerUICtrl.prototype.getSize = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var size;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var layer = items[i].getLayer();

      if (layer) {
        var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());

        if (config) {
          size = os.style.getConfigSize(config);
        }
      }
    }
  }

  return size || os.style.DEFAULT_FEATURE_SIZE;
};


/**
 * Gets the line dash from the item(s)
 * @return {Array<number>|undefined} The line
 */
os.ui.layer.VectorLayerUICtrl.prototype.getLineDash = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var lineDash;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var layer = items[i].getLayer();

      if (layer) {
        var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());

        if (config) {
          lineDash = os.style.getConfigLineDash(config);
        }
      }
    }
  }

  return lineDash;
};


/**
 * Gets the icon from the item(s)
 * @return {?osx.icon.Icon} The icon
 */
os.ui.layer.VectorLayerUICtrl.prototype.getIcon = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var icon = null;

  if (items && items.length > 0) {
    var source = os.data.DataManager.getInstance().getSource(items[0].getId());
    if (source && source.getGeometryShape() == os.style.ShapeType.ICON) {
      var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
      icon = os.style.getConfigIcon(config) || os.ui.file.kml.getDefaultIcon();
    }
  }

  return icon;
};


/**
 * Gets the icon from the item(s).
 * @return {?osx.icon.Icon} The icon.
 */
os.ui.layer.VectorLayerUICtrl.prototype.getCenterIcon = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var icon = null;

  if (items && items.length > 0) {
    var source = os.data.DataManager.getInstance().getSource(items[0].getId());
    if (source && source.getCenterGeometryShape() == os.style.ShapeType.ICON) {
      var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
      icon = os.style.getConfigIcon(config) || os.ui.file.kml.getDefaultIcon();
    }
  }

  return icon;
};


/**
 * Gets the shape from the item(s)
 * @return {string} The shape
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShape = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shape;

  if (items && items.length > 0) {
    var source = os.osDataManager.getSource(items[0].getId());
    if (source) {
      shape = source.getGeometryShape();
    }
  }

  return shape || os.style.DEFAULT_SHAPE;
};


/**
 * Gets the shape options that apply to the item(s)
 * @return {Array<string>} The available shape options
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShapes = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shapes = goog.object.getKeys(os.style.SHAPES);

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = os.osDataManager.getSource(items[i].getId());
      if (source && source instanceof os.source.Vector) {
        shapes = goog.array.filter(shapes, source.supportsShape, source);
      }
    }
  }

  return shapes;
};


/**
 * Gets the shape from the item(s)
 * @return {string} The shape
 */
os.ui.layer.VectorLayerUICtrl.prototype.getCenterShape = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shape;

  if (items && items.length > 0) {
    var source = os.osDataManager.getSource(items[0].getId());
    if (source) {
      var tempShape = source.getCenterGeometryShape();
      if (!os.style.ELLIPSE_REGEXP.test(tempShape) && !os.style.DEFAULT_REGEXP.test(tempShape)) {
        shape = tempShape;
      }
    }
  }

  return shape || os.style.DEFAULT_CENTER_SHAPE;
};


/**
 * Gets the shape options that apply to the item(s)
 * @return {Array<string>} The available shape options
 */
os.ui.layer.VectorLayerUICtrl.prototype.getCenterShapes = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var shapes = goog.object.getKeys(os.style.SHAPES);

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = os.osDataManager.getSource(items[i].getId());
      if (source && source instanceof os.source.Vector) {
        shapes = goog.array.filter(shapes, source.isNotEllipseOrLOBOrDefault, source);
      }
    }
  }

  return shapes;
};


/**
 * Updates the locked state on the UI.
 * @return {boolean} are all the items locable
 */
os.ui.layer.VectorLayerUICtrl.prototype.getLockable = function() {
  this['lock'] = false;
  // Only display lock option if all sources are lockable
  var lockable = true;
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = os.osDataManager.getSource(items[i].getId());
      if (source && source instanceof os.source.Vector) {
        if (!source.isLockable()) {
          lockable = false;
          break;
        } else {
          this['lock'] = source.isLocked();
        }
      }
    }
  }
  return lockable;
};


/**
 * Gets the label size
 * @return {number} The size
 */
os.ui.layer.VectorLayerUICtrl.prototype.getLabelSize = function() {
  return Number(this.getValue(os.ui.layer.getLabelSize));
};


/**
 * Gets the label color
 * @return {string} The color
 */
os.ui.layer.VectorLayerUICtrl.prototype.getLabelColor = function() {
  return this.getValue(os.ui.layer.getLabelColor);
};


/**
 * Gets the columns to use for the label
 * @return {Array<os.data.ColumnDefinition>} The columns
 */
os.ui.layer.VectorLayerUICtrl.prototype.getColumns = function() {
  return this.getValue(os.ui.layer.getColumns);
};


/**
 * Gets the selected columns to use for the label
 * @return {Array<!os.style.label.LabelConfig>} The columns
 */
os.ui.layer.VectorLayerUICtrl.prototype.getColumn = function() {
  return this.getValue(os.ui.layer.getColumn, []);
};


/**
 * Gets the show label value
 * @return {boolean} The show label
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShowLabel = function() {
  return this.getValue(os.ui.layer.getShowLabel);
};


/**
 * Gets the unique id
 * @return {boolean} The show label
 */
os.ui.layer.VectorLayerUICtrl.prototype.getUniqueId = function() {
  return this.getValue(os.ui.layer.getUniqueId);
};


/**
 * Set the locked state of the source
 * @export
 */
os.ui.layer.VectorLayerUICtrl.prototype.onLockChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = os.osDataManager.getSource(items[i].getId());
      if (source && source instanceof os.source.Vector && source.isLockable()) {
        source.setLocked(this['lock']);
      }
    }
  }
};


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
 * @export
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


/**
 * @return {os.webgl.AltitudeMode}
 */
os.ui.layer.VectorLayerUICtrl.prototype.getAltitudeMode = function() {
  var altitudeMode = os.webgl.AltitudeMode.ABSOLUTE;
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = os.osDataManager.getSource(items[i].getId());
      if (source && source instanceof os.source.Vector) {
        altitudeMode = source.getAltitudeMode();
        break;
      }
    }
  }
  return altitudeMode;
};


/**
 * Set the altitude mode of the source
 * @export
 */
os.ui.layer.VectorLayerUICtrl.prototype.onAltitudeModeChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = os.osDataManager.getSource(items[i].getId());
      if (source && source instanceof os.source.Vector) {
        source.setAltitudeMode(this['altitudeMode']);
      }
    }
  }
};


/**
 * Set the unique ID field of the source.
 * @export
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


/**
 * The column for the icon rotation
 * @return {string}
 */
os.ui.layer.VectorLayerUICtrl.prototype.getRotationColumn = function() {
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
 */
os.ui.layer.VectorLayerUICtrl.prototype.getShowRotation = function() {
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
 */
os.ui.layer.VectorLayerUICtrl.prototype.onShowRotationChange = function(event, value) {
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
 */
os.ui.layer.VectorLayerUICtrl.prototype.onRotationColumnChange = function(event, value) {
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


/**
 * Handle map property changes.
 * @param {os.events.PropertyChangeEvent} event The change event.
 * @private
 */
os.ui.layer.VectorLayerUICtrl.prototype.onMapView3DChange_ = function(event) {
  if (event.getProperty() == os.MapChange.VIEW3D) {
    this['showAltitudeModes'] = event.getNewValue() && this['altitudeModes'].length > 0;
    os.ui.apply(this.scope);
  }
};


/**
 * @inheritDoc
 */
os.ui.layer.VectorLayerUICtrl.prototype.disposeInternal = function() {
  os.map.mapContainer.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapView3DChange_, false, this);
  os.ui.layer.VectorLayerUICtrl.base(this, 'disposeInternal');
};


/**
 * Gets a human readable name for altitude mode
 * @param {os.webgl.AltitudeMode} altitudeMode - The mode to map to a name
 * @return {string}
 * @export
 */
os.ui.layer.VectorLayerUICtrl.prototype.mapAltitudeModeToName = os.webgl.mapAltitudeModeToName;
