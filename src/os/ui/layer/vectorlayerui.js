goog.module('os.ui.layer.VectorLayerUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.layer.EllipseOptionsUI');
goog.require('os.ui.layer.IconStyleControlsUI');
goog.require('os.ui.layer.LabelControlsUI');
goog.require('os.ui.layer.LobOptionsUI');
goog.require('os.ui.layer.VectorStyleControlsUI');
goog.require('os.ui.uiSwitchDirective');

const Delay = goog.require('goog.async.Delay');
const {rgbArrayToHex} = goog.require('goog.color');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const {ROOT} = goog.require('os');
const MapChange = goog.require('os.MapChange');
const {toHexString, toRgbArray} = goog.require('os.color');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const VectorLayerCenterShape = goog.require('os.command.VectorLayerCenterShape');
const VectorLayerColor = goog.require('os.command.VectorLayerColor');
const VectorLayerFillOpacity = goog.require('os.command.VectorLayerFillOpacity');
const VectorLayerIcon = goog.require('os.command.VectorLayerIcon');
const VectorLayerLabel = goog.require('os.command.VectorLayerLabel');
const VectorLayerLabelColor = goog.require('os.command.VectorLayerLabelColor');
const VectorLayerLabelSize = goog.require('os.command.VectorLayerLabelSize');
const VectorLayerLineDash = goog.require('os.command.VectorLayerLineDash');
const VectorLayerReplaceStyle = goog.require('os.command.VectorLayerReplaceStyle');
const VectorLayerRotation = goog.require('os.command.VectorLayerRotation');
const VectorLayerShape = goog.require('os.command.VectorLayerShape');
const VectorLayerShowLabel = goog.require('os.command.VectorLayerShowLabel');
const VectorLayerShowRotation = goog.require('os.command.VectorLayerShowRotation');
const VectorLayerSize = goog.require('os.command.VectorLayerSize');
const VectorUniqueIdCmd = goog.require('os.command.VectorUniqueIdCmd');
const ColorChangeType = goog.require('os.command.style.ColorChangeType');
const Settings = goog.require('os.config.Settings');
const DataManager1 = goog.require('os.data.DataManager');
const DataManager = goog.require('os.data.DataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osImplements = goog.require('os.implements');
const osLayer = goog.require('os.layer');
const ILayer = goog.require('os.layer.ILayer');
const PropertyChange = goog.require('os.layer.PropertyChange');
const {getSavedPresetId, getSavedPresetClean} = goog.require('os.layer.preset');
const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const PresetMenuButton = goog.require('os.layer.preset.PresetMenuButton');
const {getMapContainer} = goog.require('os.map.instance');
const VectorSource = goog.require('os.source.Vector');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const osLabel = goog.require('os.style.label');
const {apply} = goog.require('os.ui');
const ColorControlType = goog.require('os.ui.ColorControlType');
const Module = goog.require('os.ui.Module');
const UISwitchEventType = goog.require('os.ui.UISwitchEventType');
const {GOOGLE_EARTH_ICON_SET, getDefaultIcon, replaceGoogleUri} = goog.require('os.ui.file.kml');
const IconPickerEventType = goog.require('os.ui.icon.IconPickerEventType');
const osUiLayer = goog.require('os.ui.layer');
const EllipseColumnsUI = goog.require('os.ui.layer.EllipseColumnsUI');
const LabelControlsEventType = goog.require('os.ui.layer.LabelControlsEventType');
const {Controller: DefaultLayerUICtrl} = goog.require('os.ui.layer.DefaultLayerUI');
const VectorStyleControlsEventType = goog.require('os.ui.layer.VectorStyleControlsEventType');
const {mapAltitudeModeToName} = goog.require('os.webgl');
const AltitudeMode = goog.require('os.webgl.AltitudeMode');

const ICommand = goog.requireType('os.command.ICommand');
const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * The directive for vector layer controls
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/layer/vector.html',
  controller: Controller,
  controllerAs: 'vector'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'vectorlayerui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the vector layer UI
 * @unrestricted
 */
class Controller extends DefaultLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    /**
     * Icons available to the icon picker.
     * @type {!Array<!osx.icon.Icon>}
     */
    this['iconSet'] = GOOGLE_EARTH_ICON_SET;

    /**
     * Function to translate image sources from the icon set.
     * @type {function(string):string}
     */
    this['iconSrc'] = replaceGoogleUri;

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
     * @type {Array<AltitudeMode>}
     */
    this['altitudeModes'] = [];

    /**
     * If the altitude modes should be shown
     * @type {boolean}
     */
    this['showAltitudeModes'] = false;

    /**
     * If the Styles are "dirty" or equal to a Preset
     * @type {boolean}
     */
    this['showPresetsDropdown'] = true;

    /**
     * The unique identifier for the layer.
     * @type {ColumnDefinition}
     */
    this['uniqueId'] = null;

    /**
     * Feature Toggle
     * @type {boolean}
     */
    this['allowEllipseConfig'] = Settings.getInstance().get(EllipseColumnsUI.ALLOW_ELLIPSE_CONFIG, false);

    /**
     * Delay for grouping label size changes.
     * @type {Delay}
     */
    this.labelSizeChangeDelay = new Delay(this.updateLabelSize, 500, this);

    /**
     * Flag for whether the label state needs to be refreshed.
     * @type {boolean}
     */
    this.refreshLabels = true;

    this.defaultColorControl = ColorControlType.PICKER;

    // add events that should trigger a UI update
    this.initEvents.push(PropertyChange.LOCK);

    // register scope event listeners
    getMapContainer().listen(GoogEventType.PROPERTYCHANGE, this.onMapView3DChange_, false, this);

    // style change handlers
    $scope.$on('size.slidestop', this.onSizeChange.bind(this));
    $scope.$on('color.change', this.onColorChange.bind(this));
    $scope.$on('color.reset', this.onColorReset.bind(this));

    $scope.$on(IconPickerEventType.CHANGE, this.onIconChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.SHAPE_CHANGE, this.onShapeChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, this.onCenterShapeChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.LINE_DASH_CHANGE, this.onLineDashChange.bind(this));

    // New default added to the base constructor
    this.defaults['fillOpacity'] = osStyle.DEFAULT_FILL_ALPHA;

    $scope.$on('fillColor.change', this.onFillColorChange.bind(this));
    $scope.$on('fillColor.reset', this.onFillColorReset.bind(this));

    // label change handlers
    $scope.$on('labelColor.change', this.onLabelColorChange.bind(this));
    $scope.$on('labelColor.reset', this.onLabelColorReset.bind(this));
    $scope.$watch('labelSize', this.onLabelSizeChange.bind(this));

    $scope.$on(LabelControlsEventType.COLUMN_CHANGE, this.onLabelColumnChange.bind(this));
    $scope.$on(LabelControlsEventType.SHOW_LABELS_CHANGE, this.onShowLabelsChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.onShowRotationChange.bind(this));
    $scope.$on(VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.onRotationColumnChange.bind(this));
    $scope.$on(PresetMenuButton.EventType.APPLY_PRESET, this.applyPreset.bind(this));
    $scope.$on(PresetMenuButton.EventType.TOGGLE_PRESET, this.togglePreset.bind(this));
  }

  /**
   * @inheritDoc
   */
  onLayerPropertyChange(event) {
    if (!this.isDisposed()) {
      if (event instanceof PropertyChangeEvent) {
        var p = event.getProperty();
        if (p === PropertyChange.LABEL) {
          this.refreshLabels = true;
        }
      }

      super.onLayerPropertyChange(event);
    }
  }

  /**
   * @inheritDoc
   */
  onItemsChange(newVal, oldVal) {
    if (!this.isDisposed()) {
      // whenever the selected layers change, the labels UI needs to be refreshed
      this.refreshLabels = true;
    }

    super.onItemsChange(newVal, oldVal);
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (this.scope) {
      this.scope['color'] = this.getColor();
      this.scope['opacity'] = this.getOpacity();
      this.scope['size'] = this.getSize();
      this.scope['lineDash'] = this.getLineDash();
      this.scope['icon'] = this.getIcon();
      this.scope['centerIcon'] = this.getCenterIcon();
      this.scope['shape'] = this.getShape();
      this.scope['shapes'] = this.getShapes();
      this.scope['centerShape'] = this.getCenterShape();
      this.scope['centerShapes'] = this.getCenterShapes();
      this.scope['lockable'] = this.getLockable();
      this.scope['fillColor'] = this.getFillColor() || this.scope['color'];
      this.scope['fillOpacity'] = this.getFillOpacity();
      this['altitudeMode'] = this.getAltitudeMode();
      this['columns'] = this.getColumns();
      this['showRotation'] = this.getShowRotation();
      this['rotationColumn'] = this.getRotationColumn();

      const layerNodes = this.getLayerNodes();
      if (layerNodes.length == 1) {
        this['layer'] = layerNodes[0].getLayer();
      }

      this.loadPresets();
      this.updateReplaceStyle_();

      if (this.scope['items'] && this.scope['items'].length == 1) {
        // NOTE: This initUI method can get called a-lot, depending on some events that get routed to this method.
        this.scope['columns'] = this.getColumns();
        this['uniqueId'] = this.getValue(osUiLayer.getUniqueId);
      } else {
        this.scope['columns'] = null;
        this.scope['column'] = null;
        this['uniqueId'] = null;
      }

      this.reconcileLabelsState_();

      if (this.scope['showLabels'] !== this.getShowLabel()) {
        this.scope['showLabels'] = this.getShowLabel();
      }

      if (this.scope['labelColor'] !== this.getLabelColor()) {
        this.scope['labelColor'] = this.getLabelColor();
      }

      if (this.scope['labelSize'] !== this.getLabelSize() ||
          this.scope['labelSize'] !== osLabel.DEFAULT_SIZE) {
        this.scope['labelSize'] = this.getLabelSize() || osLabel.DEFAULT_SIZE;
      }

      var mapContainer = getMapContainer();
      var webGLRenderer = mapContainer.getWebGLRenderer();
      if (webGLRenderer) {
        this['altitudeModes'] = webGLRenderer.getAltitudeModes();
        this['showAltitudeModes'] = this['altitudeModes'].length > 0 && mapContainer.is3DEnabled();
      }

      // update the shape UI
      this.scope.$broadcast(UISwitchEventType.UPDATE);
    }
  }

  /**
   * Get the shape-specific configuration UI.
   *
   * @return {string|undefined}
   */
  getShapeUIInternal() {
    if (this.scope != null) {
      var shape = this.scope['shape'] || '';
      if (osStyle.ELLIPSE_REGEXP.test(shape)) {
        return 'ellipseoptions';
      } else if (osStyle.LOB_REGEXP.test(shape)) {
        return 'loboptions';
      }
    }

    return undefined;
  }

  /**
   * @inheritDoc
   */
  getProperties() {
    return {
      'opacity': osLayer.setOpacity,
      'fillOpacity': () => {},
      'brightness': osLayer.setBrightness,
      'contrast': osLayer.setContrast,
      'hue': osLayer.setHue,
      'saturation': osLayer.setSaturation
    };
  }

  /**
   * Decide when to show the rotation option
   *
   * @return {boolean}
   * @export
   */
  showRotationOption() {
    if (this.scope != null) {
      var shape = this.scope['shape'] || '';
      var centr = this.scope['centerShape'] || '';
      return shape == osStyle.ShapeType.ICON || (osStyle.CENTER_REGEXP.test(shape) && centr == osStyle.ShapeType.ICON);
    }

    return false;
  }

  /**
   * Updates the layer preset state on the UI.
   *
   * @private
   */
  loadPresets() {
    this['presets'] = null;

    var nodes = this.getLayerNodes();
    if (nodes && nodes.length == 1) {
      var layer = nodes[0].getLayer();

      if (layer) {
        var id = layer.getId();
        var promise = LayerPresetManager.getInstance().getPresets(id);

        if (promise) {
          promise.then((presets) => {
            if (presets && presets.length) {
              this['presets'] = presets;

              // the preset objects may change, so resolve the current selection by id
              var currentPreset = this['preset'] ? presets.find(function(p) {
                return p && p.id == this['preset'].id;
              }, this) : undefined;

              // the preset might be saved in settings
              var settingsPreset = null;
              var settingsPresetId = getSavedPresetId(id);
              if (settingsPresetId) {
                settingsPreset = presets.find(function(p) {
                  return p && p.id == settingsPresetId;
                }, this);
              }

              // set the current selection for the UI
              this['preset'] = settingsPreset || currentPreset || presets[0];

              var isCleanPreset = getSavedPresetClean(id);
              this['showPresetsDropdown'] = isCleanPreset;

              // tell the directive to re-render now that we have a new list of presets
              apply(this.scope);
            }
          }, undefined, this);
        }
      }
    }
  }

  /**
   * Apply the layer preset.
   * @export
   */
  applyPreset() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['preset'];
      var layer = items[0].getLayer();

      // flag the UI is clean
      this['showPresetsDropdown'] = true;

      // call lpm to get all the benefits
      LayerPresetManager.getInstance().applyPreset(layer.getId(), value);
    }
  }

  /**
   * Update the UI when the layer preset booleans are toggled
   * @param {angular.Scope.Event} event
   * @param {osx.layer.Preset} preset
   */
  togglePreset(event, preset) {
    var found = (this['presets'] || []).find((p) => {
      return p.id == preset.id;
    });

    // update local to match value returned by service
    if (found) {
      found.default = preset.default;
      found.published = preset.published;
      apply(this.scope);
    }
  }

  /**
   * Synchronizes the scope labels.
   *
   * @private
   */
  reconcileLabelsState_() {
    if (this.refreshLabels) {
      // Duplicate the labels so the command stack undo/redo works
      var labels = this.getColumn();

      // the UI modifies the label config objects, so they must be cloned or undo/redo will not work.
      var clone = [];
      labels.forEach(function(label) {
        clone.push(osLabel.cloneConfig(label));
      }, this);

      // If empty, add placeholder
      if (clone.length === 0) {
        clone.push(osLabel.cloneConfig());
      }

      this.scope['labels'] = clone;

      this.refreshLabels = false;
    }
  }

  /**
   * Handles changes to color
   *
   * @param {angular.Scope.Event} event
   * @param {string} value
   * @protected
   */
  onColorChange(event, value) {
    event.stopPropagation();

    var color = this.getColor();
    var fillColor = this.getFillColor() || color;

    // if the color and fill color are the same, change both of them
    if (color == fillColor) {
      this.createCommand(
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            var cmds = [];

            // We run these sequentially so that they retain the different opacities
            cmds.push(new VectorLayerColor(
                layer.getId(), value, null, ColorChangeType.STROKE)
            );
            cmds.push(new VectorLayerColor(
                layer.getId(), value, null, ColorChangeType.FILL)
            );

            var sequence = new SequenceCommand();
            sequence.setCommands(cmds);
            sequence.title = 'Change Color';

            return sequence;
          }
      );
    } else {
      this.createCommand(
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorLayerColor(
                layer.getId(), value, null, ColorChangeType.STROKE);
          }
      );
    }
  }

  /**
   * Handles color reset
   * @param {angular.Scope.Event} event
   * @protected
   */
  onColorReset(event) {
    event.stopPropagation();

    // clear the layer color config value
    this.onColorChange(event, '');

    // reset to the layer color
    this.scope['color'] = this.getColor();
  }

  /**
   * Handles changes to fill color
   * @param {angular.Scope.Event} event
   * @param {string} value
   * @protected
   */
  onFillColorChange(event, value) {
    event.stopPropagation();

    // If no value provided, set to the fill color
    if (!value) {
      value = this.getColor() || osStyle.DEFAULT_FILL_COLOR;
    }

    // Make sure the value includes the current opacity
    var colorValue = toRgbArray(value);
    colorValue[3] = this.scope['fillOpacity'];

    this.scope['fillColor'] = osStyle.toRgbaString(colorValue);

    var fn =
      /**
       * @param {ILayer} layer
       * @return {ICommand}
       */
      function(layer) {
        return new VectorLayerColor(
            layer.getId(), colorValue, null, ColorChangeType.FILL);
      };

    this.createCommand(fn);
  }

  /**
   * Handles fill color reset
   * @param {angular.Scope.Event} event
   * @protected
   */
  onFillColorReset(event) {
    event.stopPropagation();

    // reset to match the base color
    this.onFillColorChange(event, '');
  }

  /**
   * @override
   */
  onValueChange(callback, event, value) {
    // If we are not dealing with fill opacity, let the parent handle this event
    if (event.name == 'fillOpacity.slide') {
      this.scope['fillOpacity'] = value;
    } else {
      super.onValueChange(callback, event, value);
    }
  }

  /**
   * @inheritDoc
   */
  onSliderStop(callback, key, event, value) {
    if (event && event.name == 'fillOpacity.slidestop') {
      // Fill opacity must be changed at the style level
      event.stopPropagation();

      var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new VectorLayerFillOpacity(layer.getId(), value);
        };

      this.createCommand(fn);
    } else {
      super.onSliderStop(callback, key, event, value);
    }
  }

  /**
   * Handles changes to size
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onSizeChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new VectorLayerSize(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles changes to line dash
   *
   * @param {angular.Scope.Event} event
   * @param {Array<number>} value
   * @protected
   */
  onLineDashChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new VectorLayerLineDash(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles changes to the icon.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {osx.icon.Icon} value The new value.
   * @export
   */
  onIconChange(event, value) {
    event.stopPropagation();

    if (value) {
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorLayerIcon(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handles changes to the shape.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {string} value The new value.
   * @export
   */
  onShapeChange(event, value) {
    event.stopPropagation();
    if (value) {
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorLayerShape(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handles changes to the center shape.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {string} value The new value.
   * @export
   */
  onCenterShapeChange(event, value) {
    event.stopPropagation();
    if (value) {
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorLayerCenterShape(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handles changes to label color
   *
   * @param {angular.Scope.Event} event
   * @param {string} value
   * @protected
   */
  onLabelColorChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new VectorLayerLabelColor(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles label color reset
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onLabelColorReset(event) {
    event.stopPropagation();
    this.scope['labelColor'] = this.getLabelColor();

    // clear the label color config value
    this.onLabelColorChange(event, '');
  }

  /**
   * Handles changes to label size.
   *
   * @param {number} newVal The new label size.
   * @param {number} oldVal The old label size.
   * @protected
   */
  onLabelSizeChange(newVal, oldVal) {
    if (newVal !== oldVal) {
      this.labelSizeChangeDelay.start();
    }
  }

  /**
   * Updates the label size.
   */
  updateLabelSize() {
    var value = /** @type {number} */ (this.scope['labelSize']);
    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new VectorLayerLabelSize(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles column changes
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onLabelColumnChange(event) {
    event.stopPropagation();

    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length === 1) {
      /**
       * @param {ILayer} layer
       * @return {ICommand}
       */
      var fn = function(layer) {
        return new VectorLayerLabel(layer.getId(), this.scope['labels']);
      }.bind(this);

      this.createCommand(fn);
    }
  }

  /**
   * Handles changes to the show labels checkbox.
   *
   * @param {angular.Scope.Event} event
   * @param {boolean} value
   * @protected
   */
  onShowLabelsChange(event, value) {
    event.stopPropagation();

    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new VectorLayerShowLabel(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Gets the color from the item(s)
   *
   * @return {?string} a hex color string
   * @protected
   */
  getColor() {
    var items = this.getLayerNodes();

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var layer = items[i].getLayer();

        if (layer) {
          var config = StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            var color = /** @type {Array<number>} */ (osStyle.getConfigColor(config, true));
            return color ? rgbArrayToHex(color) : color;
          }
        }
      }
    }

    return null;
  }

  /**
   * Gets the fill color from the item(s)
   * @return {?string} a hex color string
   * @protected
   */
  getFillColor() {
    var items = this.getLayerNodes();

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var layer = items[i].getLayer();

        if (layer) {
          var config = StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            var color = osStyle.getConfigColor(config, false, StyleField.FILL);
            if (color) {
              return toHexString(color);
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Gets the fill opacity from the item(s)
   * @return {?number} an opacity amount
   * @protected
   */
  getFillOpacity() {
    var items = this.getLayerNodes();
    var opacity = osStyle.DEFAULT_FILL_ALPHA;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var layer = items[i].getLayer();

        if (layer) {
          var config = StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            if (Array.isArray(config)) {
              config = config[0];
            }
            var color = osStyle.getConfigColor(config, true, StyleField.FILL);
            if (Array.isArray(color) && color.length >= 4) {
              opacity = color[3];
            }
          }
        }
      }
    }

    return opacity;
  }

  /**
   * Gets the size from the item(s)
   *
   * @return {number} The size
   */
  getSize() {
    var items = this.getLayerNodes();
    var size;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var layer = items[i].getLayer();

        if (layer) {
          var config = StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            size = osStyle.getConfigSize(config);
          }
        }
      }
    }

    return size || osStyle.DEFAULT_FEATURE_SIZE;
  }

  /**
   * Gets the line dash from the item(s)
   *
   * @return {Array<number>|undefined} The line
   */
  getLineDash() {
    var items = this.getLayerNodes();
    var lineDash;

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var layer = items[i].getLayer();

        if (layer) {
          var config = StyleManager.getInstance().getLayerConfig(items[0].getId());

          if (config) {
            lineDash = osStyle.getConfigLineDash(config);
          }
        }
      }
    }

    return lineDash;
  }

  /**
   * Gets the icon from the item(s)
   *
   * @return {?osx.icon.Icon} The icon
   */
  getIcon() {
    var items = this.getLayerNodes();
    var icon = null;

    if (items && items.length > 0) {
      var source = DataManager.getInstance().getSource(items[0].getId());
      if (source && source.getGeometryShape() == osStyle.ShapeType.ICON) {
        var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
        icon = osStyle.getConfigIcon(config) || getDefaultIcon();
      }
    }

    return icon;
  }

  /**
   * Gets the icon from the item(s).
   *
   * @return {?osx.icon.Icon} The icon.
   */
  getCenterIcon() {
    var items = this.getLayerNodes();
    var icon = null;

    if (items && items.length > 0) {
      var source = DataManager.getInstance().getSource(items[0].getId());
      if (source && source.getCenterGeometryShape() == osStyle.ShapeType.ICON) {
        var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
        icon = osStyle.getConfigIcon(config) || getDefaultIcon();
      }
    }

    return icon;
  }

  /**
   * Gets the shape from the item(s)
   *
   * @return {string} The shape
   */
  getShape() {
    var items = this.getLayerNodes();
    var shape;

    if (items && items.length > 0) {
      var source = DataManager1.getInstance().getSource(items[0].getId());
      if (source) {
        shape = source.getGeometryShape();
      }
    }

    return shape || osStyle.DEFAULT_SHAPE;
  }

  /**
   * Gets the shape options that apply to the item(s)
   *
   * @return {Array<string>} The available shape options
   */
  getShapes() {
    if (this['allowEllipseConfig']) {
      return Object.keys(osStyle.SHAPES);
    } else {
      var items = this.getLayerNodes();
      var shapes = Object.keys(osStyle.SHAPES);

      if (items && items.length > 0) {
        for (var i = 0, n = items.length; i < n; i++) {
          var source = DataManager1.getInstance().getSource(items[i].getId());
          if (source && source instanceof VectorSource) {
            shapes = shapes.filter(source.supportsShape, source);
          }
        }
      }
      return shapes;
    }
  }

  /**
   * Gets the shape from the item(s)
   *
   * @return {string} The shape
   */
  getCenterShape() {
    var items = this.getLayerNodes();
    var shape;

    if (items && items.length > 0) {
      var source = DataManager1.getInstance().getSource(items[0].getId());
      if (source) {
        var tempShape = source.getCenterGeometryShape();
        if (!osStyle.ELLIPSE_REGEXP.test(tempShape) && !osStyle.DEFAULT_REGEXP.test(tempShape)) {
          shape = tempShape;
        }
      }
    }

    return shape || osStyle.DEFAULT_CENTER_SHAPE;
  }

  /**
   * Gets the shape options that apply to the item(s)
   *
   * @return {Array<string>} The available shape options
   */
  getCenterShapes() {
    var items = this.getLayerNodes();
    var shapes = Object.keys(osStyle.SHAPES);

    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = DataManager1.getInstance().getSource(items[i].getId());
        if (source && source instanceof VectorSource) {
          shapes = shapes.filter(source.isNotEllipseOrLOBOrDefault, source);
        }
      }
    }

    return shapes;
  }

  /**
   * Updates the locked state on the UI.
   *
   * @return {boolean} are all the items locable
   */
  getLockable() {
    this['lock'] = false;
    // Only display lock option if all sources are lockable
    var lockable = true;
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = DataManager1.getInstance().getSource(items[i].getId());
        if (source && source instanceof VectorSource) {
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
  }

  /**
   * Gets the label size
   *
   * @return {number} The size
   */
  getLabelSize() {
    return Number(this.getValue(osUiLayer.getLabelSize));
  }

  /**
   * Gets the label color
   *
   * @return {string} The color
   */
  getLabelColor() {
    return this.getValue(osUiLayer.getLabelColor);
  }

  /**
   * Gets the columns to use for the label
   *
   * @return {Array<ColumnDefinition>} The columns
   */
  getColumns() {
    return this.getValue(osUiLayer.getColumns);
  }

  /**
   * Gets the selected columns to use for the label
   *
   * @return {Array<!osLabel.LabelConfig>} The columns
   */
  getColumn() {
    return this.getValue(osUiLayer.getColumn, []);
  }

  /**
   * Gets the show label value
   *
   * @return {boolean} The show label
   */
  getShowLabel() {
    return this.getValue(osUiLayer.getShowLabel);
  }

  /**
   * Set the locked state of the source
   *
   * @export
   */
  onLockChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = DataManager1.getInstance().getSource(items[i].getId());
        if (source && source instanceof VectorSource && source.isLockable()) {
          source.setLocked(this['lock']);
        }
      }
    }
  }

  /**
   * Updates the Replace Feature Style state on the UI.
   *
   * @private
   */
  updateReplaceStyle_() {
    this['showReplaceStyle'] = false;
    this['replaceStyle'] = false;

    var nodes = this.getLayerNodes();
    if (nodes && nodes.length > 0) {
      var replaceStyle;

      // only show refresh options if all sources support it
      this['showReplaceStyle'] = nodes.every(function(node) {
        var layer = node.getLayer();
        if (osImplements(layer, ILayer.ID)) {
          var options = layer.getLayerOptions();
          if (options && options[osLayer.LayerOption.SHOW_FORCE_COLOR]) {
            if (replaceStyle == null) {
              var config = StyleManager.getInstance().getLayerConfig(layer.getId());
              if (config) {
                replaceStyle = !!config[StyleField.REPLACE_STYLE];
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
  }

  /**
   * Handle changes to the Replace Feature Style option.
   *
   * @export
   */
  onReplaceStyleChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['replaceStyle'];
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorLayerReplaceStyle(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * @return {AltitudeMode}
   */
  getAltitudeMode() {
    var altitudeMode = AltitudeMode.ABSOLUTE;
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = DataManager1.getInstance().getSource(items[i].getId());
        if (source && source instanceof VectorSource) {
          altitudeMode = source.getAltitudeMode();
          break;
        }
      }
    }
    return altitudeMode;
  }

  /**
   * Set the altitude mode of the source
   *
   * @export
   */
  onAltitudeModeChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        var source = DataManager1.getInstance().getSource(items[i].getId());
        if (source && source instanceof VectorSource) {
          source.setAltitudeMode(this['altitudeMode']);
        }
      }
    }
  }

  /**
   * Set the unique ID field of the source.
   *
   * @export
   */
  onUniqueIdChange() {
    var nodes = this.getLayerNodes();
    if (nodes && nodes.length > 0) {
      var uniqueId = /** @type {ColumnDefinition} */ (this['uniqueId']);
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorUniqueIdCmd(layer.getId(), uniqueId);
          };

      this.createCommand(fn);
    }
  }

  /**
   * The column for the icon rotation
   *
   * @return {string}
   */
  getRotationColumn() {
    var items = this.getLayerNodes();
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return config[StyleField.ROTATION_COLUMN];
      }
    }

    return '';
  }

  /**
   * If arrow should be displayed for the layer(s).
   *
   * @return {boolean}
   */
  getShowRotation() {
    var items = this.getLayerNodes();
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return !!config[StyleField.SHOW_ROTATION];
      }
    }

    return false;
  }

  /**
   * Handle changes to the Show Rotation option.
   *
   * @param {angular.Scope.Event} event
   * @param {boolean} value
   */
  onShowRotationChange(event, value) {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
           */
          function(layer) {
            return new VectorLayerShowRotation(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handles column changes to the rotation
   *
   * @param {angular.Scope.Event} event
   * @param {string} value
   */
  onRotationColumnChange(event, value) {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      /**
       * @param {ILayer} layer
       * @return {ICommand}
       */
      var fn = function(layer) {
        return new VectorLayerRotation(layer.getId(), value);
      };

      this.createCommand(fn);
    }
  }

  /**
   * Handle map property changes.
   *
   * @param {PropertyChangeEvent} event The change event.
   * @private
   */
  onMapView3DChange_(event) {
    if (event.getProperty() == MapChange.VIEW3D) {
      this['showAltitudeModes'] = event.getNewValue() && this['altitudeModes'].length > 0;
      apply(this.scope);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    getMapContainer().unlisten(GoogEventType.PROPERTYCHANGE, this.onMapView3DChange_, false, this);
    dispose(this.labelSizeChangeDelay);

    super.disposeInternal();
  }

  /**
   * Gets a human readable name for altitude mode
   * @param {AltitudeMode} altitudeMode - The mode to map to a name
   * @return {string}
   * @export
   */
  mapAltitudeModeToName(altitudeMode) {
    return mapAltitudeModeToName(altitudeMode);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
