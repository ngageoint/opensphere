goog.module('plugin.file.kml.KMLNodeLayerUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.layer.IconStyleControlsUI');
goog.require('os.ui.layer.LabelControlsUI');
goog.require('os.ui.layer.VectorStyleControlsUI');
goog.require('os.ui.uiSwitchDirective');

const googArray = goog.require('goog.array');
const olArray = goog.require('ol.array');
const UrlTile = goog.require('ol.source.UrlTile');
const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const EventType = goog.require('os.action.EventType');
const osColor = goog.require('os.color');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const FeatureCenterShape = goog.require('os.command.FeatureCenterShape');
const FeatureColor = goog.require('os.command.FeatureColor');
const FeatureIcon = goog.require('os.command.FeatureIcon');
const FeatureLabel = goog.require('os.command.FeatureLabel');
const FeatureLabelColor = goog.require('os.command.FeatureLabelColor');
const FeatureLabelSize = goog.require('os.command.FeatureLabelSize');
const FeatureLineDash = goog.require('os.command.FeatureLineDash');
const FeatureOpacity = goog.require('os.command.FeatureOpacity');
const FeatureShape = goog.require('os.command.FeatureShape');
const FeatureShowLabel = goog.require('os.command.FeatureShowLabel');
const FeatureSize = goog.require('os.command.FeatureSize');
const ParallelCommand = goog.require('os.command.ParallelCommand');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const ColorChangeType = goog.require('os.command.style.ColorChangeType');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const osFeature = goog.require('os.feature');
const DynamicFeature = goog.require('os.feature.DynamicFeature');
const geo = goog.require('os.geo');
const VectorSource = goog.require('os.source.Vector');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleType = goog.require('os.style.StyleType');
const label = goog.require('os.style.label');
const {Controller: FeatureEditCtrl} = goog.require('os.ui.FeatureEditUI');
const Module = goog.require('os.ui.Module');
const kml = goog.require('os.ui.file.kml');
const {Controller: VectorLayerUICtrl, directive: vectorLayerUIDirective} = goog.require('os.ui.layer.VectorLayerUI');


/**
 * Supported shapes.
 * @type {Array}
 */
const supportedShapes = [
  osStyle.ShapeType.NONE,
  osStyle.ShapeType.POINT,
  osStyle.ShapeType.SQUARE,
  osStyle.ShapeType.TRIANGLE,
  osStyle.ShapeType.ICON,
  osStyle.ShapeType.ELLIPSE,
  osStyle.ShapeType.ELLIPSE_CENTER
];


/**
 * Supported center shapes.
 * @type {Array}
 */
const supportedCenterShapes = [
  osStyle.ShapeType.POINT,
  osStyle.ShapeType.SQUARE,
  osStyle.ShapeType.TRIANGLE,
  osStyle.ShapeType.ICON
];


/**
 * The directive for stream layer controls
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = vectorLayerUIDirective();
  dir.templateUrl = ROOT + 'views/plugin/kml/kmlnodelayerui.html';
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'kmlnodelayerui';


/**
 * Add the directive to the module
 */
Module.directive('kmlnodelayerui', [directive]);



/**
 * Controller for the stream layer UI
 * @unrestricted
 */
class Controller extends VectorLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    var defaultColumns = FeatureEditCtrl.FIELDS.filter(function(field) {
      return !osFeature.isInternalField(field);
    }).map(function(col) {
      return new ColumnDefinition(col);
    });

    /**
     * Columns available for labels.
     * @type {!Array<string>}
     */
    this['labelColumns'] = defaultColumns;

    $scope.$on('opacity.slide', this.onOpacityValueChange.bind(this));
    $scope.$on('opacity.slidestop', this.onOpacityChange.bind(this));
    $scope.$on('fillOpacity.slide', this.onFillOpacityValueChange.bind(this));
    $scope.$on('fillOpacity.slidestop', this.onFillOpacityChange.bind(this));

    dispatcher.getInstance().listen(EventType.REFRESH, this.initUI, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    dispatcher.getInstance().unlisten(EventType.REFRESH, this.initUI, false, this);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getProperties() {
    return {}; // opacity set up in constructor
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (this.scope && !this.isFeatureFillable()) {
      delete this.scope['fillColor'];
      delete this.scope['fillOpacity'];
    }
  }

  /**
   * @inheritDoc
   */
  getColor() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }
            var color = /** @type {Array<number>|string|undefined} */ (osStyle.getConfigColor(config)) ||
              osStyle.DEFAULT_LAYER_COLOR;
            if (color) {
              return osColor.toHexString(color);
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getFillColor() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }

            var color = osStyle.getConfigColor(config, false, StyleField.FILL);
            if (color) {
              return osColor.toHexString(color);
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getFillOpacity() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var opacity = osStyle.DEFAULT_FILL_ALPHA;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }
            var color = osStyle.getConfigColor(config, true, StyleField.FILL);
            if (color) {
              opacity = color[3];
            }
          }
        }
      }
    }

    return opacity;
  }

  /**
   * @inheritDoc
   */
  getSize() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var size;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }
            size = osStyle.getConfigSize(config) || osStyle.DEFAULT_FEATURE_SIZE;
          }
        }
      }
    }

    return size || osStyle.DEFAULT_FEATURE_SIZE;
  }

  /**
   * @inheritDoc
   */
  getLineDash() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var lineDash;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }
            lineDash = osStyle.getConfigLineDash(config);
          }
        }
      }
    }

    return lineDash;
  }

  /**
   * @inheritDoc
   */
  getIcon() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var icon = null;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config.length > 1 ? config[1] : config[0];
            }
            icon = osStyle.getConfigIcon(config) || kml.getDefaultIcon();
          }
        }
      }
    }

    return icon;
  }

  /**
   * @inheritDoc
   */
  getShape() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var shape;

    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          shape = /** @type {string} */ (feature.get(StyleField.SHAPE));
        }
      }
    }
    this['shape'] = shape || osStyle.ShapeType.POINT;
    return this['shape'];
  }

  /**
   * @inheritDoc
   */
  getShapes() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var shapes = supportedShapes;

    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = items[i].getSource();
        if (source && source instanceof VectorSource) {
          shapes = googArray.filter(shapes, source.supportsShape, source);
        }
      }
    }

    return shapes;
  }

  /**
   * @inheritDoc
   */
  getCenterShape() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var shape;

    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          shape = /** @type {string} */ (feature.get(StyleField.CENTER_SHAPE));
        }
      }
    }
    this['centerShape'] = shape || osStyle.ShapeType.POINT;
    return this['centerShape'];
  }

  /**
   * @inheritDoc
   */
  getCenterShapes() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var shapes = supportedCenterShapes;

    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = items[i].getSource();
        if (source && source instanceof VectorSource) {
          shapes = googArray.filter(shapes, source.supportsShape, source);
        }
      }
    }

    return shapes;
  }

  /**
   * @inheritDoc
   */
  getOpacity() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    var opacity = osStyle.DEFAULT_ALPHA;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }

            var color = osStyle.getConfigColor(config, true, StyleField.STROKE);
            if (color) {
              opacity = color[3];
            }
          }
        }
      }
    }

    return opacity;
  }

  /**
   * @inheritDoc
   */
  getLabelSize() {
    return Number(this.getFeatureValue(StyleField.LABEL_SIZE, label.DEFAULT_SIZE));
  }

  /**
   * @inheritDoc
   */
  getLabelColor() {
    return this.getFeatureValue(StyleField.LABEL_COLOR, osStyle.DEFAULT_LAYER_COLOR);
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    var labelColumns = [];
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = items[i].getSource();
        labelColumns = labelColumns.concat(source.getColumnsArray().filter(function(column) {
          return !osFeature.isInternalField(column['field']);
        }));
      }
    }

    return labelColumns;
  }

  /**
   * @inheritDoc
   */
  getColumn() {
    var labelColumns = [];
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var feature = items[i].getFeature();
        if (feature) {
          var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));
          if (config) {
            if (Array.isArray(config)) {
              // locate the label config in the array
              var labelsConfig = olArray.find(config, osStyle.isLabelConfig);
              if (labelsConfig) {
                labelColumns = labelsConfig[StyleField.LABELS];
              }
            } else if (config[StyleField.LABELS]) {
              labelColumns = config[StyleField.LABELS];
            }
          }
        }
      }
    }

    return labelColumns;
  }

  /**
   * @inheritDoc
   */
  getShowLabel() {
    return this.getFeatureValue(StyleField.SHOW_LABELS);
  }

  /**
   * @inheritDoc
   */
  getLockable() {
    this['lock'] = false;
    // Only display lock option if all sources are lockable
    var lockable = true;
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = items[i].getSource();
        if (source && source instanceof VectorSource && !source.isLockable()) {
          lockable = false;
          break;
        } else {
          this['lock'] = source.isLocked();
        }
      }
    }
    return lockable;
  }

  /**
   * Handle changes to opacity while it changes via slide controls
   *
   * @param {?angular.Scope.Event} event
   * @param {?} value
   * @protected
   */
  onOpacityValueChange(event, value) {
    event.stopPropagation();
    this.scope['opacity'] = value;
  }

  /**
   * Handle changes to fill opacity while it changes via slide controls
   *
   * @param {?angular.Scope.Event} event
   * @param {?} value
   * @protected
   */
  onFillOpacityValueChange(event, value) {
    event.stopPropagation();
    this.scope['fillOpacity'] = value;
  }

  /**
   * @inheritDoc
   */
  onLockChange() {
    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = items[i].getSource();
        if (source && source instanceof VectorSource && source.isLockable()) {
          source.setLocked(this['lock']);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  onColorChange(event, value) {
    if (!osColor.isColorString(value) && !Array.isArray(value)) {
      return;
    }
    event.stopPropagation();

    // Make sure the value includes the current opacity
    var colorValue = osColor.toRgbArray(value);
    colorValue[3] = this.scope['opacity'];

    // Do we have fill color/opacity to consider?
    if (this.scope['fillColor'] !== undefined && this.scope['fillOpacity'] !== undefined) {
      // Determine if we are changing both stroke and fill entirely, or keeping opacities separate, or only affecting stroke
      if (this.scope['color'] == this.scope['fillColor'] && this.scope['opacity'] == this.scope['fillOpacity']) {
        this.scope['color'] = osColor.toHexString(colorValue);
        this.scope['fillColor'] = osColor.toHexString(colorValue);

        var fn =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureColor(layerId, featureId, colorValue);
          };

        this.createFeatureCommand(fn);
      } else if (this.scope['color'] == this.scope['fillColor']) {
        this.scope['color'] = osColor.toHexString(colorValue);
        this.scope['fillColor'] = osColor.toHexString(colorValue);

        // We create two commands so that they retain the different opacities
        var strokeColor = osColor.toRgbArray(this.scope['color']);
        strokeColor[3] = this.scope['opacity'];
        var fillColor = osColor.toRgbArray(this.scope['fillColor']);
        fillColor[3] = this.scope['fillOpacity'];

        var fn2 =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            var cmds = [];

            cmds.push(new FeatureColor(
                layerId, featureId, strokeColor, null, ColorChangeType.STROKE)
            );
            cmds.push(new FeatureColor(
                layerId, featureId, fillColor, null, ColorChangeType.FILL)
            );

            var sequence = new SequenceCommand();
            sequence.setCommands(cmds);
            sequence.title = 'Change Color';

            return sequence;
          };

        this.createFeatureCommand(fn2);
      } else {
        this.scope['color'] = osColor.toHexString(colorValue);
        var fn3 =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureColor(layerId, featureId, colorValue, null,
                ColorChangeType.STROKE);
          };

        this.createFeatureCommand(fn3);
      }
    } else {
      // We are not taking fill into consideration
      var fn5 =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new FeatureColor(layerId, featureId, colorValue);
        };

      this.createFeatureCommand(fn5);
    }
  }

  /**
   * @inheritDoc
   */
  onFillColorChange(event, value) {
    if (!osColor.isColorString(value) && !Array.isArray(value)) {
      return;
    }
    event.stopPropagation();

    // Make sure the value includes the current opacity
    var colorValue = osColor.toRgbArray(value);
    colorValue[3] = this.scope['fillOpacity'];

    this.scope['fillColor'] = osStyle.toRgbaString(colorValue);

    var fn =
      /**
       * @param {string} layerId
       * @param {string} featureId
       * @return {os.command.ICommand}
       */
      function(layerId, featureId) {
        return new FeatureColor(layerId, featureId, colorValue, null, ColorChangeType.FILL);
      };

    this.createFeatureCommand(fn);
  }

  /**
   * @inheritDoc
   */
  onSizeChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new FeatureSize(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }

  /**
   * @inheritDoc
   */
  onLineDashChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new FeatureLineDash(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }

  /**
   * @inheritDoc
   */
  onIconChange(event, value) {
    event.stopPropagation();

    if (value) {
      var fn =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureIcon(layerId, featureId, value);
          };

      this.createFeatureCommand(fn);
    }
  }

  /**
   * @inheritDoc
   */
  onShapeChange(event, value) {
    event.stopPropagation();
    if (value) {
      var fn =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureShape(layerId, featureId, value);
          };

      this.createFeatureCommand(fn);
    }
  }

  /**
   * @inheritDoc
   */
  onCenterShapeChange(event, value) {
    event.stopPropagation();
    if (value) {
      var fn =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureCenterShape(layerId, featureId, value);
          };

      this.createFeatureCommand(fn);
    }
  }

  /**
   * Handle changes to opacity while it changes via slide controls
   *
   * @param {?angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onOpacityChange(event, value) {
    event.stopPropagation();

    if (value != null) {
      var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new FeatureOpacity(layerId, featureId, value, null, ColorChangeType.STROKE);
        };

      this.createFeatureCommand(fn);
    }
  }

  /**
   * Handle changes to fill opacity while it changes via slide controls
   *
   * @param {?angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onFillOpacityChange(event, value) {
    event.stopPropagation();

    if (value != null) {
      var fn =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureOpacity(layerId, featureId, value, null, ColorChangeType.FILL);
          };

      this.createFeatureCommand(fn);
    }
  }

  /**
   * @inheritDoc
   */
  updateLabelSize() {
    var value = /** @type {number} */ (this.scope['labelSize']);
    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new FeatureLabelSize(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }

  /**
   * @inheritDoc
   */
  onLabelColorChange(event, value) {
    event.stopPropagation();

    if (value) {
      var fn =
          /**
           * @param {string} layerId
           * @param {string} featureId
           * @return {os.command.ICommand}
           */
          function(layerId, featureId) {
            return new FeatureLabelColor(layerId, featureId, value);
          };

      this.createFeatureCommand(fn);
    }
  }

  /**
   * Set it to the current track color
   *
   * @inheritDoc
   */
  onLabelColorReset(event) {
    event.stopPropagation();
    this.scope['labelColor'] = this.getColor();

    // clear the label color config value
    this.onLabelColorChange(event, this.scope['labelColor']);
  }

  /**
   * @inheritDoc
   */
  onLabelColumnChange(event) {
    event.stopPropagation();

    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length === 1) {
      /**
       * @param {string} layerId
       * @param {string} featureId
       * @return {os.command.ICommand}
       */
      var fn = function(layerId, featureId) {
        return new FeatureLabel(layerId, featureId, this.scope['labels']);
      }.bind(this);

      this.createFeatureCommand(fn);
    }
  }

  /**
   * @inheritDoc
   */
  onShowLabelsChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {string} layerId
         * @param {string} featureId
         * @return {os.command.ICommand}
         */
        function(layerId, featureId) {
          return new FeatureShowLabel(layerId, featureId, value);
        };

    this.createFeatureCommand(fn);
  }

  /**
   * @inheritDoc
   */
  updateRefresh() {
    this['showRefresh'] = false;
    this['refresh'] = null;

    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var refreshInterval;

      // only show refresh options if all sources support it
      this['showRefresh'] = googArray.every(items, function(item) {
        var source = item.getSource();
        if (source && (source instanceof VectorSource || source instanceof UrlTile &&
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
        this['refresh'] = olArray.find(this['refreshOptions'], function(option) {
          return option.interval == refreshInterval;
        });
      }
    }
  }

  /**
   * Gets a value from the feature
   *
   * @param {string} field The field to retrieve
   * @param {?=} opt_default
   * @return {?}
   * @protected
   */
  getFeatureValue(field, opt_default) {
    var defaultVal = opt_default !== undefined ? opt_default : 1;

    var features = this.getFeatures();
    for (var i = 0, n = features.length; i < n; i++) {
      var val = features[i].get(field);
      if (val) {
        return val;
      }
    }

    return defaultVal;
  }

  /**
   * Get the layer nodes from the list of UI items.
   *
   * @return {!Array<!ol.Feature>}
   * @protected
   */
  getFeatures() {
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
  }

  /**
   * Creates a command to run on each feature
   *
   * @param {function(string, string):os.command.ICommand} commandFunction
   */
  createFeatureCommand(commandFunction) {
    var cmds = [];

    var items = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0; i < items.length; i++) {
        var feature = items[i].getFeature();
        var source = items[i].getSource();
        if (feature && source) {
          var featureId = feature.getId();
          var layerId = source.getId();
          if (featureId != null && layerId != null) {
            featureId = String(featureId);
            layerId = String(layerId);
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
      cmd = new ParallelCommand();
      cmd.setCommands(cmds);
      cmd.title = cmds[0].title + ' (' + cmds.length + ' features)';
    } else if (cmds.length > 0) {
      cmd = cmds[0];
    }

    if (cmd) {
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  /**
   * If the feature is dynamic, which means it is a time based track
   *
   * @return {boolean}
   * @export
   */
  isFeatureDynamic() {
    var features = this.getFeatures();
    var feature = features.length > 0 ? features[0] : null;
    return feature instanceof DynamicFeature;
  }

  /**
   * If the feature is fillable, which means it should show fill controls
   *
   * @return {boolean}
   * @export
   */
  isFeatureFillable() {
    var features = this.getFeatures();
    var feature = features.length > 0 ? features[0] : null;
    if (feature) {
      let hasPolyGeom = false;

      osFeature.forEachGeometry(feature, (geom) => {
        hasPolyGeom = geo.isGeometryPolygonal(geom, true) || hasPolyGeom;
      });

      return hasPolyGeom;
    }

    return false;
  }

  /**
   * Leave the rotation choices to the Place Add/Edit dialog since it is more involved
   *
   * @inheritDoc
   */
  showRotationOption() {
    return false;
  }

  /**
   * Hide the ellipse options (ellipsoids/ground ref), also lob isn't supported at this time
   *
   * @inheritDoc
   */
  getShapeUIInternal() {
    return undefined;
  }

  /**
   * If the icon picker should be displayed.
   *
   * @return {boolean}
   * @export
   */
  showIcon() {
    return osStyle.ICON_REGEXP.test(this['shape']);
  }

  /**
   * If the icon picker should be displayed.
   *
   * @return {boolean}
   * @export
   */
  showCenterIcon() {
    return !!osStyle.CENTER_LOOKUP[this['shape']] && osStyle.ICON_REGEXP.test(this['centerShape']);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
