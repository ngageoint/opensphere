goog.provide('plugin.file.kml.KMLNodeLayerUICtrl');
goog.provide('plugin.file.kml.KMLNodeLayerUICtrl.UIEventType');
goog.provide('plugin.file.kml.kmlNodeLayerUIDirective');
goog.require('os.command.FeatureCenterShape');
goog.require('os.command.FeatureColor');
goog.require('os.command.FeatureIcon');
goog.require('os.command.FeatureLabel');
goog.require('os.command.FeatureLabelColor');
goog.require('os.command.FeatureLabelSize');
goog.require('os.command.FeatureLineDash');
goog.require('os.command.FeatureOpacity');
goog.require('os.command.FeatureShape');
goog.require('os.command.FeatureShowLabel');
goog.require('os.command.FeatureSize');
goog.require('os.command.ParallelCommand');
goog.require('os.data.ColumnDefinition');
goog.require('os.ui.Module');
goog.require('os.ui.layer.VectorLayerUICtrl');
goog.require('os.ui.layer.iconStyleControlsDirective');
goog.require('os.ui.layer.labelControlsDirective');
goog.require('os.ui.layer.vectorLayerUIDirective');
goog.require('os.ui.layer.vectorStyleControlsDirective');
goog.require('os.ui.slick.column');
goog.require('os.ui.uiSwitchDirective');


/**
 * Supported shapes.
 * @type {Array}
 */
plugin.file.kml.shapes = [
  os.style.ShapeType.NONE,
  os.style.ShapeType.POINT,
  os.style.ShapeType.SQUARE,
  os.style.ShapeType.TRIANGLE,
  os.style.ShapeType.ICON,
  os.style.ShapeType.ELLIPSE,
  os.style.ShapeType.ELLIPSE_CENTER
];


/**
 * Supported center shapes.
 * @type {Array}
 */
plugin.file.kml.centerShapes = [
  os.style.ShapeType.POINT,
  os.style.ShapeType.SQUARE,
  os.style.ShapeType.TRIANGLE,
  os.style.ShapeType.ICON
];


/**
 * The directive for stream layer controls
 * @return {angular.Directive}
 */
plugin.file.kml.kmlNodeLayerUIDirective = function() {
  var dir = os.ui.layer.vectorLayerUIDirective();
  dir.templateUrl = os.ROOT + 'views/plugin/kml/kmlnodelayerui.html';
  dir.controller = plugin.file.kml.KMLNodeLayerUICtrl;
  return dir;
};


/**
 * Add the directive to the mist module
 */
os.ui.Module.directive('kmlnodelayerui', [plugin.file.kml.kmlNodeLayerUIDirective]);



/**
 * Controller for the stream layer UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @extends {os.ui.layer.VectorLayerUICtrl}
 * @ngInject
 */
plugin.file.kml.KMLNodeLayerUICtrl = function($scope, $element, $timeout) {
  plugin.file.kml.KMLNodeLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);

  var defaultColumns = os.ui.FeatureEditCtrl.FIELDS.filter(function(field) {
    return !os.feature.isInternalField(field);
  }).map(function(col) {
    return new os.data.ColumnDefinition(col);
  });

  /**
   * Columns available for labels.
   * @type {!Array<string>}
   */
  this['labelColumns'] = defaultColumns;

  $scope.$on('opacity.slide', this.onOpacityValueChange.bind(this));
  $scope.$on('opacity.slidestart', this.onSliderStart.bind(this));
  $scope.$on('opacity.slidestop', this.onOpacityChange.bind(this));

  os.dispatcher.listen(plugin.file.kml.KMLNodeLayerUICtrl.UIEventType.REFRESH, this.initUI, false, this);
};
goog.inherits(plugin.file.kml.KMLNodeLayerUICtrl, os.ui.layer.VectorLayerUICtrl);


/**
 * UI event types
 * @enum {string}
 */
plugin.file.kml.KMLNodeLayerUICtrl.UIEventType = {
  REFRESH: 'refresh'
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.disposeInternal = function() {
  os.dispatcher.unlisten(os.ui.events.UIEventType.TOGGLE_UI, this.initUI, false, this);
  plugin.file.kml.KMLNodeLayerUICtrl.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getProperties = function() {
  return {}; // opacity set up in constructor
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getColor = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

        if (config) {
          if (goog.isArray(config)) {
            config = config[0];
          }
          var color = /** @type {Array<number>|string|undefined} */ (os.style.getConfigColor(config)) ||
            os.style.DEFAULT_LAYER_COLOR;
          if (color) {
            return os.color.toHexString(color);
          }
        }
      }
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getSize = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var size;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

        if (config) {
          if (goog.isArray(config)) {
            config = config[0];
          }
          size = os.style.getConfigSize(config) || os.style.DEFAULT_FEATURE_SIZE;
        }
      }
    }
  }

  return size || os.style.DEFAULT_FEATURE_SIZE;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getLineDash = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var lineDash;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

        if (config) {
          if (goog.isArray(config)) {
            config = config[0];
          }
          lineDash = os.style.getConfigLineDash(config);
        }
      }
    }
  }

  return lineDash;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getIcon = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var icon = null;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

        if (config) {
          if (goog.isArray(config)) {
            config = config.length > 1 ? config[1] : config[0];
          }
          icon = os.style.getConfigIcon(config) || os.ui.file.kml.getDefaultIcon();
        }
      }
    }
  }

  return icon;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getShape = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var shape;

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        shape = /** @type {string} */ (feature.get(os.style.StyleField.SHAPE));
      }
    }
  }
  this['shape'] = shape || os.style.ShapeType.POINT;
  return this['shape'];
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getShapes = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var shapes = plugin.file.kml.shapes;

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = items[i].getSource();
      if (source && source instanceof os.source.Vector) {
        shapes = goog.array.filter(shapes, source.supportsShape, source);
      }
    }
  }

  return shapes;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getCenterShape = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var shape;

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        shape = /** @type {string} */ (feature.get(os.style.StyleField.CENTER_SHAPE));
      }
    }
  }
  this['centerShape'] = shape || os.style.ShapeType.POINT;
  return this['centerShape'];
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getCenterShapes = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var shapes = plugin.file.kml.centerShapes;

  if (items && items.length > 0) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = items[i].getSource();
      if (source && source instanceof os.source.Vector) {
        shapes = goog.array.filter(shapes, source.supportsShape, source);
      }
    }
  }

  return shapes;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getOpacity = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var opacity = os.style.DEFAULT_ALPHA;

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

        if (config) {
          if (goog.isArray(config)) {
            config = config[0];
          }
          opacity = os.style.getConfigOpacityColor(config) || os.style.DEFAULT_ALPHA;
        }
      }
    }
  }

  return opacity;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getLabelSize = function() {
  return Number(this.getFeatureValue(os.style.StyleField.LABEL_SIZE, os.style.label.DEFAULT_SIZE));
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getLabelColor = function() {
  return this.getFeatureValue(os.style.StyleField.LABEL_COLOR, os.style.DEFAULT_LAYER_COLOR);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getColumns = function() {
  var labelColumns = [];
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = items[i].getSource();
      labelColumns = labelColumns.concat(source.getColumnsArray().filter(function(column) {
        return !os.feature.isInternalField(column['field']);
      }));
    }
  }

  return labelColumns;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getColumn = function() {
  var labelColumns = [];
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));
        if (config) {
          if (goog.isArray(config)) {
            // locate the label config in the array
            var labelsConfig = ol.array.find(config, os.style.isLabelConfig);
            if (labelsConfig) {
              labelColumns = labelsConfig[os.style.StyleField.LABELS];
            }
          } else if (config[os.style.StyleField.LABELS]) {
            labelColumns = config[os.style.StyleField.LABELS];
          }
        }
      }
    }
  }

  return labelColumns;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getShowLabel = function() {
  return this.getFeatureValue(os.style.StyleField.SHOW_LABELS);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getLockable = function() {
  this['lock'] = false;
  // Only display lock option if all sources are lockable
  var lockable = true;
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = items[i].getSource();
      if (source && source instanceof os.source.Vector && !source.isLockable()) {
        lockable = false;
        break;
      } else {
        this['lock'] = source.isLocked();
      }
    }
  }
  return lockable;
};


/**
 * Handle changes to opacity while it changes via slide controls
 * @param {?angular.Scope.Event} event
 * @param {?} value
 * @protected
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onOpacityValueChange = function(event, value) {
  event.stopPropagation();
  this.scope['opacity'] = value; // do not set this on the config - the command takes care of that
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onLockChange = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var source = items[i].getSource();
      if (source && source instanceof os.source.Vector && source.isLockable()) {
        source.setLocked(this['lock']);
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onColorChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {string} layerId
       * @param {string} featureId
       * @return {os.command.ICommand}
       */
      function(layerId, featureId) {
        return new os.command.FeatureColor(layerId, featureId, value);
      };

  this.createFeatureCommand(fn);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onSizeChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {string} layerId
       * @param {string} featureId
       * @return {os.command.ICommand}
       */
      function(layerId, featureId) {
        return new os.command.FeatureSize(layerId, featureId, value);
      };

  this.createFeatureCommand(fn);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onLineDashChange = function(event, value) {
  event.stopPropagation();

  var fn =
      /**
       * @param {string} layerId
       * @param {string} featureId
       * @return {os.command.ICommand}
       */
      function(layerId, featureId) {
        return new os.command.FeatureLineDash(layerId, featureId, value);
      };

  this.createFeatureCommand(fn);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onIconChange = function(event, value) {
  event.stopPropagation();

  if (value) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureIcon(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onShapeChange = function(event, value) {
  event.stopPropagation();
  if (value) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureShape(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onCenterShapeChange = function(event, value) {
  event.stopPropagation();
  if (value) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureCenterShape(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * Handles changes to color
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onOpacityChange = function(event, value) {
  event.stopPropagation();

  if (value) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureOpacity(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onLabelSizeChange = function(event, value) {
  event.stopPropagation();

  if (value) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureLabelSize(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onLabelColorChange = function(event, value) {
  event.stopPropagation();

  if (value) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureLabelColor(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * Set it to the current track color
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onLabelColorReset = function(event) {
  event.stopPropagation();
  this.scope['labelColor'] = this.getColor();

  // clear the label color config value
  this.onLabelColorChange(event, this.scope['labelColor']);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onLabelColumnChange = function(event) {
  event.stopPropagation();

  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length === 1) {
    var fn = goog.bind(
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureLabel(layerId, featureId, this.scope['labels']);
        }, this);

    this.createFeatureCommand(fn);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.onShowLabelsChange = function(event, value) {
  event.stopPropagation();

  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length === 1) {
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new os.command.FeatureShowLabel(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.updateRefresh = function() {
  this['showRefresh'] = false;
  this['refresh'] = null;

  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var refreshInterval;

    // only show refresh options if all sources support it
    this['showRefresh'] = goog.array.every(items, function(item) {
      var source = item.getSource();
      if (source && (source instanceof os.source.Vector || source instanceof ol.source.UrlTile &&
          source.isRefreshEnabled())) {
        if (refreshInterval == null) {
          // init the control to the refresh interval of the first item
          refreshInterval = source.getRefreshInterval();
        }

        return true;
      }

      return false;
    });

    if (refreshInterval != null) {
      // find the refresh interval by interval
      this['refresh'] = ol.array.find(this['refreshOptions'], function(option) {
        return option.interval == refreshInterval;
      });
    }
  }
};


/**
 * Gets a value from the feature
 * @param {string} field The field to retrieve
 * @param {?=} opt_default
 * @return {?}
 * @protected
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getFeatureValue = function(field, opt_default) {
  var defaultVal = opt_default !== undefined ? opt_default : 1;

  var features = this.getFeatures();
  for (var i = 0, n = features.length; i < n; i++) {
    var val = features[i].get(field);
    if (val) {
      return val;
    }
  }

  return defaultVal;
};


/**
 * Get the layer nodes from the list of UI items.
 * @return {!Array<!ol.Feature>}
 * @protected
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getFeatures = function() {
  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  var features = [];

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var feature = items[i].getFeature();
      if (feature) {
        features = features.concat(feature);
      }
    }
  }

  return features;
};


/**
 * Creates a command to run on each feature
 * @param {function(string, string):os.command.ICommand} commandFunction
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.createFeatureCommand = function(commandFunction) {
  var cmds = [];

  var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0; i < items.length; i++) {
      var feature = items[i].getFeature();
      var source = items[i].getSource();
      if (feature && source) {
        var featureId = feature.getId();
        var layerId = source.getId();
        if (featureId && layerId) {
          if (typeof featureId == 'number') {
            featureId = featureId.toString();
          }
          var cmd = commandFunction(layerId, featureId);
          if (cmd) { // if we have a feature and get a command, add it
            cmds.push(cmd);
          }
        }
      }
    }
  }

  var cmd = null;
  if (cmds.length > 1) {
    cmd = new os.command.ParallelCommand();
    cmd.setCommands(cmds);
    cmd.title = cmds[0].title + ' (' + cmds.length + ' features)';
  } else if (cmds.length > 0) {
    cmd = cmds[0];
  }

  if (cmd) {
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }
};


/**
 * If the feature is dynamic, which means it is a time based track
 * @return {boolean}
 * @export
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.isFeatureDynamic = function() {
  var features = this.getFeatures();
  var feature = features.length > 0 ? features[0] : null;
  return feature instanceof os.feature.DynamicFeature;
};


/**
 * Leave the rotation choices to the Place Add/Edit dialog since it is more involved
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.showRotationOption = function() {
  return false;
};


/**
 * Hide the ellipse options (ellipsoids/ground ref), also lob isn't supported at this time
 * @inheritDoc
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.getShapeUIInternal = function() {
  return undefined;
};


/**
 * If the icon picker should be displayed.
 * @return {boolean}
 * @export
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.showIcon = function() {
  return os.style.ICON_REGEXP.test(this['shape']);
};


/**
 * If the icon picker should be displayed.
 * @return {boolean}
 * @export
 */
plugin.file.kml.KMLNodeLayerUICtrl.prototype.showCenterIcon = function() {
  return !!os.style.CENTER_LOOKUP[this['shape']] && os.style.ICON_REGEXP.test(this['centerShape']);
};
