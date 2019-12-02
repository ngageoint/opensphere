goog.provide('os.ui.FeatureEditCtrl');
goog.provide('os.ui.featureEditDirective');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.dom.classlist');
goog.require('goog.events.KeyHandler');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEventType');
goog.require('ol.array');
goog.require('ol.events');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.Point');
goog.require('os.MapContainer');
goog.require('os.action.EventType');
goog.require('os.data.ColumnDefinition');
goog.require('os.feature');
goog.require('os.geo');
goog.require('os.map');
goog.require('os.math.Units');
goog.require('os.ol.feature');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.AnyDateCtrl');
goog.require('os.ui.datetime.AnyDateHelp');
goog.require('os.ui.datetime.AnyDateType');
goog.require('os.ui.file.kml');
goog.require('os.ui.geo.PositionEventType');
goog.require('os.ui.geo.positionDirective');
goog.require('os.ui.geo.ringOptionsDirective');
goog.require('os.ui.layer.labelControlsDirective');
goog.require('os.ui.layer.vectorStyleControlsDirective');
goog.require('os.ui.list');
goog.require('os.ui.text.tuiEditorDirective');
goog.require('os.ui.util.validationMessageDirective');
goog.require('os.ui.window');
goog.require('os.webgl.AltitudeMode');


/**
 * Directive for editing a feature.
 *
 * @return {angular.Directive}
 */
os.ui.featureEditDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/featureedit.html',
    controller: os.ui.FeatureEditCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('featureedit', [os.ui.featureEditDirective]);


/**
 * @typedef {{
 *   feature: (ol.Feature|undefined),
 *   geometry: (ol.geom.SimpleGeometry|undefined),
 *   label: (string|undefined),
 *   name: (string|undefined),
 *   callback: Function
 * }}
 */
os.ui.FeatureEditOptions;



/**
 * Controller function for the featureedit directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.FeatureEditCtrl = function($scope, $element, $timeout) {
  os.ui.FeatureEditCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * Listen key for map events.
   * @type {?ol.EventsKey}
   * @protected
   */
  this.mapListenKey = null;

  /**
   * Callback to show windows.
   * @type {?Function}
   * @protected
   */
  this.windowToggle = null;

  /**
   * Feature used to preview changes.
   * @type {ol.Feature}
   * @protected
   */
  this.previewFeature = null;

  /**
   * Keyboard event handler used while listening for map clicks.
   * @type {goog.events.KeyHandler}
   * @protected
   */
  this.keyHandler = null;

  /**
   * Global UID for this controller, used to create unique id's for form elements.
   * @type {number}
   */
  this['uid'] = goog.getUid(this);

  /**
   * The temporary feature id for this window.
   * @type {string}
   * @protected
   */
  this.tempFeatureId = os.ui.FeatureEditCtrl.TEMP_ID + this['uid'];

  /**
   * Help tooltips.
   * @type {!Object<string, string>}
   */
  this['help'] = {
    'semiMajor': 'Semi-major axis of the ellipse in the specified units.',
    'semiMinor': 'Semi-minor axis of the ellipse in the specified units.',
    'orientation': 'Orientation of the ellipse in degrees from north between 0° and 360°. Values outside this range ' +
        'will be adjusted automatically.',
    'iconRotation': 'Rotation of the icon in degrees from north between 0° and 360°. Values outside this range ' +
        'will be adjusted automatically.'
  };

  /**
   * The feature color.
   * @type {string}
   */
  this['color'] = os.color.toHexString(os.style.DEFAULT_LAYER_COLOR);

  /**
   * The feature opacity.
   * @type {string}
   */
  this['opacity'] = os.style.DEFAULT_ALPHA;

  /**
   * The feature size.
   * @type {number}
   */
  this['size'] = os.style.DEFAULT_FEATURE_SIZE;

  /**
   * The feature fill color
   * @type {string}
   */
  this['fillColor'] = os.color.toHexString(os.style.DEFAULT_LAYER_COLOR);

  /**
   * The feature fill opacity
   * @type {string}
   */
  this['fillOpacity'] = os.style.DEFAULT_FILL_ALPHA;

  /**
   * The feature icon.
   * @type {!osx.icon.Icon}
   */
  this['icon'] = /** @type {!osx.icon.Icon} */ ({// os.ui.file.kml.Icon to osx.icon.Icon
    title: os.ui.file.kml.getDefaultIcon().title,
    path: os.ui.file.kml.getDefaultIcon().path,
    options: os.ui.file.kml.getDefaultIcon().options
  });

  /**
   * The feature center icon.
   * @type {!osx.icon.Icon}
   */
  this['centerIcon'] = /** @type {!osx.icon.Icon} */ ({// os.ui.file.kml.Icon to osx.icon.Icon
    path: os.ui.file.kml.getDefaultIcon().path
  });

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
   * The feature geometry.
   * @type {osx.geo.Location}
   */
  this['pointGeometry'] = null;

  /**
   * @type {!os.ui.datetime.AnyDateType}
   */
  this['dateType'] = os.ui.datetime.AnyDateType.NOTIME;

  /**
   * @type {number|undefined}
   */
  this['startTime'] = undefined;

  /**
   * @type {number|undefined}
   */
  this['endTime'] = undefined;

  /**
   * @type {string}
   */
  this['description'] = '';

  /**
   * @type {string}
   */
  this['name'] = '';

  /**
   * Supported shapes.
   * @type {Array}
   */
  this['shapes'] = [
    os.style.ShapeType.NONE,
    os.style.ShapeType.POINT,
    os.style.ShapeType.SQUARE,
    os.style.ShapeType.TRIANGLE,
    os.style.ShapeType.ICON,
    os.style.ShapeType.ELLIPSE,
    os.style.ShapeType.ELLIPSE_CENTER
  ];

  /**
   * Selected shape.
   * @type {string}
   */
  this['shape'] = os.style.ShapeType.POINT;

  /**
   * Supported center shapes.
   * @type {Array}
   */
  this['centerShapes'] = [
    os.style.ShapeType.POINT,
    os.style.ShapeType.SQUARE,
    os.style.ShapeType.TRIANGLE,
    os.style.ShapeType.ICON
  ];

  /**
   * Selected line dash style
   */
  this['lineDash'] = undefined;

  /**
   * Selected shape.
   * @type {string}
   */
  this['centerShape'] = os.style.ShapeType.POINT;

  /**
   * Ellipse semi-major axis.
   * @type {number|undefined}
   */
  this['semiMajor'] = undefined;

  /**
   * Ellipse semi-major axis units.
   * @type {os.math.Unit}
   */
  this['semiMajorUnits'] = os.math.Units.NAUTICAL_MILES;

  /**
   * Ellipse semi-minor axis.
   * @type {number|undefined}
   */
  this['semiMinor'] = undefined;

  /**
   * Ellipse semi-minor axis units.
   * @type {os.math.Unit}
   */
  this['semiMinorUnits'] = os.math.Units.NAUTICAL_MILES;

  /**
   * Ellipse orientation, in degrees.
   * @type {number|undefined}
   */
  this['orientation'] = undefined;

  /**
   * The ring options.
   * @type {?Object<string, *>}
   */
  this['ringOptions'] = null;

  /**
   * @type {string}
   */
  this['ringTitle'] = os.ui.geo.RingTitle;

  /**
   * Icon Rotation, in degrees.
   * @type {number|undefined}
   */
  this['iconRotation'] = undefined;

  /**
   * Supported ellipse axis units.
   * @type {!Array<!os.math.Units>}
   */
  this['units'] = [
    os.math.Units.NAUTICAL_MILES,
    os.math.Units.MILES,
    os.math.Units.KILOMETERS,
    os.math.Units.METERS
  ];

  /**
   * Feature altitude.
   * @type {number}
   */
  this['altitude'] = 0;

  /**
   * Feature altitude units.
   * @type {number}
   */
  this['altUnits'] = os.math.Units.METERS;

  /**
   * Altitude unit options.
   * @type {string}
   */
  this['altUnitOptions'] = goog.object.getValues(os.math.Units);

  /**
   * The altitude modes supported
   * @type {Array<os.webgl.AltitudeMode>}
   */
  this['altitudeModes'] = ol.obj.getValues(os.webgl.AltitudeMode);


  if (os.map.mapContainer) {
    var webGLRenderer = os.map.mapContainer.getWebGLRenderer();
    if (webGLRenderer) {
      this['altitudeModes'] = webGLRenderer.getAltitudeModes();
    }
  }

  var defaultAltMode = os.webgl.AltitudeMode.CLAMP_TO_GROUND;

  /**
   * The selected altitude mode
   * @type {?os.webgl.AltitudeMode}
   */
  this['altitudeMode'] = this['altitudeModes'].indexOf(defaultAltMode) > -1 ? defaultAltMode : null;

  /**
   * Configured label color.
   * @type {string}
   */
  this['labelColor'] = os.color.toHexString(os.style.DEFAULT_LAYER_COLOR);

  /**
   * Configured label size.
   * @type {number}
   */
  this['labelSize'] = os.style.label.DEFAULT_SIZE;

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

  /**
   * Label configuration objects.
   * @type {!Array<!Object>}
   */
  this['labels'] = [];

  /**
   * If the Label Options controls should be displayed.
   * @type {boolean}
   */
  this['showLabels'] = true;

  /**
   * Time help content.
   * @type {os.ui.datetime.AnyDateHelp}
   */
  this['timeHelp'] = {
    title: 'Time Selection',
    content: 'Add a time to enable interaction with the Timeline. ' +
        'If \'No Time\' is selected, the Place will always be visible',
    pos: 'right'
  };

  /**
   * The feature edit options.
   * @type {!os.ui.FeatureEditOptions}
   * @protected
   */
  this.options = /** @type {!os.ui.FeatureEditOptions} */ ($scope['options'] || {});

  /**
   * @type {boolean}
   */
  this['timeEditEnabled'] = this.options['timeEditEnabled'] !== undefined ?
    this.options['timeEditEnabled'] : true;

  /**
   * Callback to fire when the dialog is closed.
   * @type {Function}
   * @protected
   */
  this.callback = this.options['callback'];

  /**
   * The default expanded options section.
   * @type {string}
   * @protected
   */
  this.defaultExpandedOptionsId = 'featureStyle' + this['uid'];

  /**
   * Original properties when editing a feature.
   * @type {Object<string, *>}
   * @private
   */
  this.originalProperties_ = null;

  /**
   * The original geometry when editing a feature.
   * @type {ol.geom.Geometry}
   * @protected
   */
  this.originalGeometry = null;

  var feature = /** @type {ol.Feature|undefined} */ (this.options['feature']);
  if (feature) {
    // grab available columns off the feature source if available, and don't show internal columns
    var source = os.feature.getSource(feature);
    if (source) {
      this['labelColumns'] = source.getColumnsArray().filter(function(column) {
        return !os.feature.isInternalField(column['field']);
      });

      // set time edit support
      this['timeEditEnabled'] = source.isTimeEditEnabled();
    }

    if (!feature.getId()) {
      feature.setId(this.tempFeatureId);
    }

    // when editing, we update the existing feature so we don't have to worry about hiding it or overlapping a
    // temporary feature.
    this.previewFeature = feature;
    this.originalProperties_ = feature.getProperties();

    if (this.originalProperties_) {
      // we don't care about or want these sticking around, so remove them
      delete this.originalProperties_[os.style.StyleType.SELECT];
      delete this.originalProperties_[os.style.StyleType.HIGHLIGHT];
      delete this.originalProperties_[os.style.StyleType.LABEL];

      // if a feature config exists, create a deep clone of it so the correct config is restored on cancel
      var oldConfig = this.originalProperties_[os.style.StyleType.FEATURE];
      if (oldConfig) {
        this.originalProperties_[os.style.StyleType.FEATURE] = os.object.unsafeClone(oldConfig);
      }

      if (!this.originalProperties_[os.style.StyleField.LABEL_COLOR]) {
        this.originalProperties_[os.style.StyleField.LABEL_COLOR] = undefined;
      }

      if (!this.originalProperties_[os.style.StyleField.LABEL_SIZE]) {
        this.originalProperties_[os.style.StyleField.LABEL_SIZE] = undefined;
      }
    }

    this.loadFromFeature(feature);
    this.updatePreview();
  } else {
    this.createPreviewFeature();
  }

  if (this['pointGeometry']) {
    $scope.$watch('ctrl.pointGeometry.lat', this.updatePreview.bind(this));
    $scope.$watch('ctrl.pointGeometry.lon', this.updatePreview.bind(this));
  }

  $scope.$watch('ctrl.description', this.updatePreview.bind(this));
  $scope.$watch('ctrl.color', this.onIconColorChange.bind(this));
  $scope.$watch('ctrl.lineDash', this.onLineDashChange.bind(this));
  $scope.$watch('ctrl.opacity', this.updatePreview.bind(this));
  $scope.$watch('ctrl.size', this.updatePreview.bind(this));
  $scope.$watch('ctrl.shape', this.updatePreview.bind(this));
  $scope.$watch('ctrl.centerShape', this.updatePreview.bind(this));
  $scope.$watch('ctrl.labelColor', this.updatePreview.bind(this));
  $scope.$watch('ctrl.labelSize', this.updatePreview.bind(this));
  $scope.$watch('ctrl.showLabels', this.updatePreview.bind(this));
  $scope.$on('opacity.slide', this.onOpacityValueChange.bind(this));
  $scope.$on('fillColor.change', this.onFillColorChange.bind(this));
  $scope.$on('fillColor.reset', this.onFillColorReset.bind(this));
  $scope.$on('fillOpacity.slidestop', this.onFillOpacityChange.bind(this));

  $scope.$on(os.ui.WindowEventType.CANCEL, this.onCancel.bind(this));
  $scope.$on(os.ui.icon.IconPickerEventType.CHANGE, this.onIconChange.bind(this));
  $scope.$on('labelColor.reset', this.onLabelColorReset.bind(this));
  $scope.$on(os.ui.geo.PositionEventType.MAP_ENABLED, this.onMapEnabled_.bind(this));
  $scope.$on(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE, this.onColumnChange.bind(this));
  $scope.$on('ring.update', this.onRingsChange.bind(this));

  $scope.$on(os.ui.datetime.AnyDateCtrl.CHANGE, function(event, instant, start, end) {
    event.stopPropagation();

    if (start || end) {
      this['dateType'] = os.ui.datetime.AnyDateType.RANGE;
      this['startTime'] = (new Date(start)).getTime();
      this['endTime'] = (new Date(end)).getTime();
    } else if (instant) {
      this['dateType'] = os.ui.datetime.AnyDateType.INSTANT;
      this['startTime'] = (new Date(instant)).getTime();
      this['endTime'] = undefined;
    } else {
      this['dateType'] = os.ui.datetime.AnyDateType.NOTIME;
      this['startTime'] = undefined;
      this['endTime'] = undefined;
    }

    this.updatePreview();
  }.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));

  // fire an event to inform other UIs that an edit has launched.
  os.dispatcher.dispatchEvent(os.annotation.EventType.LAUNCH_EDIT);

  $scope.$on(os.ui.text.TuiEditor.READY, function() {
    $timeout(function() {
      // expand the default section if set
      if (this.defaultExpandedOptionsId) {
        var el = document.getElementById(this.defaultExpandedOptionsId);
        if (el) {
          goog.dom.classlist.add(el, 'show');
        }
      }

      // notify the window that it can update the size
      $scope.$emit(os.ui.WindowEventType.READY);
    }.bind(this));
  }.bind(this));
};
goog.inherits(os.ui.FeatureEditCtrl, goog.Disposable);


/**
 * Identifier used for a temporary preview feature.
 * @type {string}
 * @const
 */
os.ui.FeatureEditCtrl.TEMP_ID = 'features#temporary';


/**
 * @enum {string}
 */
os.ui.FeatureEditCtrl.Field = {
  DESCRIPTION: 'description',
  MD_DESCRIPTION: '_mdDescription',
  NAME: 'name'
};


/**
 * Default label.
 * @type {!os.style.label.LabelConfig}
 */
os.ui.FeatureEditCtrl.DEFAULT_LABEL = {
  'column': os.ui.FeatureEditCtrl.Field.NAME,
  'showColumn': false
};


/**
 * Fields for a feature in this dialog.
 * @type {!Array<string>}
 * @const
 */
os.ui.FeatureEditCtrl.FIELDS = [
  os.ui.FeatureEditCtrl.Field.NAME,
  os.ui.FeatureEditCtrl.Field.DESCRIPTION,
  os.Fields.BEARING, // for icon
  os.Fields.LAT,
  os.Fields.LON,
  os.Fields.ALT,
  os.Fields.ALT_UNITS,
  os.data.RecordField.ALTITUDE_MODE,
  os.Fields.LAT_DDM,
  os.Fields.LON_DDM,
  os.Fields.LAT_DMS,
  os.Fields.LON_DMS,
  os.Fields.MGRS,
  os.Fields.SEMI_MAJOR,
  os.Fields.SEMI_MINOR,
  os.Fields.SEMI_MAJOR_UNITS,
  os.Fields.SEMI_MINOR_UNITS,
  os.Fields.ORIENTATION, // for ellipse
  os.style.StyleField.SHAPE,
  os.style.StyleField.CENTER_SHAPE,
  os.style.StyleField.LABELS,
  os.style.StyleField.LABEL_COLOR,
  os.style.StyleField.LABEL_SIZE
];


/**
 * Style used for hiding geometries such as the line and marker
 */
os.ui.FeatureEditCtrl.HIDE_GEOMETRY = '__hidden__';


/**
 * @inheritDoc
 */
os.ui.FeatureEditCtrl.prototype.disposeInternal = function() {
  os.ui.FeatureEditCtrl.base(this, 'disposeInternal');

  goog.dispose(this.keyHandler);
  this.keyHandler = null;

  if (this.mapListenKey) {
    ol.events.unlistenByKey(this.mapListenKey);
    this.mapListenKey = null;
  }

  if (this.windowToggle) {
    this.windowToggle();
    this.windowToggle = null;
  }

  if (this.previewFeature) {
    if (this.previewFeature.getId() == this.tempFeatureId) {
      os.MapContainer.getInstance().removeFeature(this.previewFeature);
    }

    this.previewFeature = null;
  }

  this.scope = null;
  this.element = null;
};


/**
 * Accept changes, saving the feature.
 *
 * @export
 */
os.ui.FeatureEditCtrl.prototype.accept = function() {
  // create a new feature if necessary
  var feature = this.options['feature'] = this.options['feature'] || new ol.Feature();
  feature.unset(os.data.RecordField.DRAWING_LAYER_NODE, true);

  // filter out empty labels when the feature is saved
  if (this['labels']) {
    this['labels'] = this['labels'].filter(function(label) {
      return label['column'] != null;
    });
  }

  this.saveToFeature(feature);

  if (!feature.getId()) {
    feature.setId(ol.getUid(feature));
  }

  if (this.callback) {
    this.callback(this.options);
  }

  this.close();
};


/**
 * Cancel edit and close the window.
 *
 * @export
 */
os.ui.FeatureEditCtrl.prototype.cancel = function() {
  this.onCancel();
  this.close();
};


/**
 * Handler for canceling the edit. This restores the state of the feature to what it was before any live
 * edits were applied while the form was up. It's called on clicking both the cancel button and the window X.
 */
os.ui.FeatureEditCtrl.prototype.onCancel = function() {
  var feature = this.options['feature'];
  if (feature && this.originalProperties_) {
    feature.setProperties(this.originalProperties_);
    os.style.setFeatureStyle(feature);

    var layer = os.feature.getLayer(feature);
    if (layer) {
      os.style.notifyStyleChange(layer, [feature]);
    }
  }

  os.dispatcher.dispatchEvent(os.action.EventType.RESTORE_FEATURE);
};


/**
 * Close the window.
 *
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Handles key events.
 *
 * @param {goog.events.KeyEvent} event
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.handleKeyEvent = function(event) {
  switch (event.keyCode) {
    case goog.events.KeyCodes.ESC:
      // cancel position selection
      if (this.scope) {
        this.scope.$broadcast(os.ui.geo.PositionEventType.MAP_ENABLED, false, 'pointGeometry');
      }
      break;
    default:
      break;
  }
};


/**
 * If an ellipse shape is selected.
 *
 * @return {boolean}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.isEllipse = function() {
  return os.style.ELLIPSE_REGEXP.test(this['shape']);
};


/**
 * If the feature has a polygonal geometry.
 *
 * @return {boolean}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.isPolygon = function() {
  if (this.isEllipse()) {
    return true;
  }

  if (this.previewFeature) {
    return os.geo.isGeometryPolygonal(this.previewFeature.getGeometry());
  }

  return false;
};


/**
 * If the feature has a line or polygonal geometry.
 *
 * @return {boolean}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.isPolygonOrLine = function() {
  if (this.previewFeature) {
    var geometry = this.previewFeature.getGeometry();
    if (geometry) {
      var type = geometry.getType();

      return type == ol.geom.GeometryType.POLYGON || type == ol.geom.GeometryType.MULTI_POLYGON ||
        type == ol.geom.GeometryType.LINE_STRING || type == ol.geom.GeometryType.MULTI_LINE_STRING;
    }
  }

  return false;
};


/**
 * If the icon picker should be displayed.
 *
 * @return {boolean}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.showIcon = function() {
  return os.style.ICON_REGEXP.test(this['shape']);
};


/**
 * If the icon picker should be displayed.
 *
 * @return {boolean}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.showCenterIcon = function() {
  return !!os.style.CENTER_LOOKUP[this['shape']] && os.style.ICON_REGEXP.test(this['centerShape']);
};


/**
 * If the feature is dynamic, which means it is a time based track
 *
 * @return {boolean}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.isFeatureDynamic = function() {
  var feature = /** @type {ol.Feature|undefined} */ (this.options['feature']);
  return feature instanceof os.feature.DynamicFeature;
};


/**
 * Handles if map clicks are propagated down to the location form.
 *
 * @param {angular.Scope.Event} event The Angular event
 * @param {boolean} isEnabled If the map should be used for location clicks.
 * @private
 */
os.ui.FeatureEditCtrl.prototype.onMapEnabled_ = function(event, isEnabled) {
  if (event.targetScope !== this.scope) {
    // only handle the event if it wasn't fired from this controller
    event.stopPropagation();

    if (isEnabled) {
      // listen for a mouse click on the map
      if (!this.mapListenKey) {
        var map = os.MapContainer.getInstance().getMap();
        this.mapListenKey = ol.events.listen(map, ol.MapBrowserEventType.SINGLECLICK, this.onMapClick_, this);
      }

      // hide all windows so it's easier to click a position
      this.windowToggle = os.ui.window.toggleVisibility();

      // listen for ESC to cancel waiting for a mouse click
      if (!this.keyHandler) {
        this.keyHandler = new goog.events.KeyHandler(goog.dom.getDocument());
        this.keyHandler.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent, false, this);
      }
    } else {
      goog.dispose(this.keyHandler);
      this.keyHandler = null;

      if (this.mapListenKey) {
        ol.events.unlistenByKey(this.mapListenKey);
        this.mapListenKey = null;
      }

      if (this.windowToggle) {
        this.windowToggle();
        this.windowToggle = null;
      }
    }
  }
};


/**
 * Handle map browser events.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation
 * @private
 */
os.ui.FeatureEditCtrl.prototype.onMapClick_ = function(mapBrowserEvent) {
  if (mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK &&
      mapBrowserEvent.coordinate && mapBrowserEvent.coordinate.length > 1) {
    // This UI will do everything in lon/lat
    var coordinate = ol.proj.transform(mapBrowserEvent.coordinate, os.map.PROJECTION, os.proj.EPSG4326);
    this.scope.$broadcast(os.ui.geo.PositionEventType.MAP_CLICK, coordinate, true);
    this.updatePreview();
  }

  return false;
};


/**
 * Updates the temporary feature style.
 *
 * @export
 */
os.ui.FeatureEditCtrl.prototype.updatePreview = function() {
  if (this.previewFeature) {
    this.saveToFeature(this.previewFeature);

    var osMap = os.MapContainer.getInstance();
    if (this.previewFeature.getId() === this.tempFeatureId && !osMap.containsFeature(this.previewFeature)) {
      osMap.addFeature(this.previewFeature);
    }

    var layer = os.feature.getLayer(this.previewFeature);
    if (layer) {
      os.style.notifyStyleChange(layer, [this.previewFeature]);
    }
  }
};


/**
 * Create a default preview feature.
 *
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.createPreviewFeature = function() {
  this.previewFeature = new ol.Feature();
  this.previewFeature.enableEvents();
  this.previewFeature.setId(this.tempFeatureId);
  this.previewFeature.set(os.data.RecordField.DRAWING_LAYER_NODE, false);

  var name = /** @type {string|undefined} */ (this.options['name']);
  if (name) {
    this.previewFeature.set(os.ui.FeatureEditCtrl.Field.NAME, name, true);
    this['name'] = name;
  }

  var geometry = /** @type {ol.geom.SimpleGeometry|undefined} */ (this.options['geometry']);
  var geometryType = geometry ? geometry.getType() : '';
  switch (geometryType) {
    case '':
      // new place without a geometry, initialize as a point
      this['pointGeometry'] = {
        'lat': NaN,
        'lon': NaN,
        'alt': NaN
      };
      break;
    case ol.geom.GeometryType.POINT:
      // geometry is a point, so allow editing it
      geometry = /** @type {ol.geom.Point} */ (geometry.clone().toLonLat());

      var coordinate = geometry.getFirstCoordinate();
      if (coordinate) {
        this['altitude'] = coordinate[2] || 0;

        this['pointGeometry'] = {
          'lon': coordinate[0],
          'lat': coordinate[1],
          'alt': this['altitude']
        };
      }
      break;
    default:
      // not a point, so disable geometry edit
      this.originalGeometry = geometry || null;
      break;
  }

  // default feature to show the name field
  this['labels'].push(goog.object.clone(os.ui.FeatureEditCtrl.DEFAULT_LABEL));
};


/**
 * Restore the UI from a feature.
 *
 * @param {!ol.Feature} feature The feature
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.loadFromFeature = function(feature) {
  this['name'] = feature.get(os.ui.FeatureEditCtrl.Field.NAME);
  this['description'] = feature.get(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION) ||
      feature.get(os.ui.FeatureEditCtrl.Field.DESCRIPTION);

  var time = feature.get(os.data.RecordField.TIME);
  if (time) {
    this['startTime'] = time.getStart();
    this['startTimeISO'] = this['startTime'] ? new Date(this['startTime']).toISOString() : undefined;
    this['endTime'] = time.getEnd() === this['startTime'] ? undefined : time.getEnd();
    this['endTimeISO'] = this['endTime'] ? new Date(this['endTime']).toISOString() : undefined;
    if (this['endTime'] > this['startTime']) {
      this['dateType'] = os.ui.datetime.AnyDateType.RANGE;
    } else {
      this['dateType'] = os.ui.datetime.AnyDateType.INSTANT;
    }
  } else {
    this['dateType'] = os.ui.datetime.AnyDateType.NOTIME;
  }

  var featureShape = feature.get(os.style.StyleField.SHAPE);
  if (this['shapes'].indexOf(featureShape) > -1) {
    this['shape'] = featureShape;
  }

  var featureCenterShape = feature.get(os.style.StyleField.CENTER_SHAPE);
  if (this['centerShapes'].indexOf(featureCenterShape) > -1) {
    this['centerShape'] = featureCenterShape;
  }

  var altitudeMode = feature.get(os.data.RecordField.ALTITUDE_MODE);

  var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));
  var featureColor;
  if (config) {
    if (goog.isArray(config)) {
      // locate the label config in the array
      var labelsConfig = ol.array.find(config, os.style.isLabelConfig);
      if (labelsConfig) {
        this['labels'] = labelsConfig[os.style.StyleField.LABELS];
      }

      // if the feature config is an array, assume the first config has the style info we want
      config = config[0];
    } else if (config[os.style.StyleField.LABELS]) {
      this['labels'] = config[os.style.StyleField.LABELS];
    }

    var size = os.style.getConfigSize(config);
    if (size) {
      this['size'] = size;
    }

    featureColor = /** @type {Array<number>|string|undefined} */ (os.style.getConfigColor(config));
    if (featureColor) {
      this['color'] = os.color.toHexString(featureColor);
      this['labelColor'] = this['color'];
    }

    // initialize fill color and opacity
    if (config['fill']['color']) {
      // use the color from config
      this['fillColor'] = os.color.toHexString(config['fill']['color']);
      this['fillOpacity'] = os.color.toRgbArray(config['fill']['color'])[3];
    } else {
      // use default values
      this['fillColor'] = os.color.toHexString(os.style.DEFAULT_LAYER_COLOR);
      this['fillOpacity'] = os.style.DEFAULT_FILL_ALPHA;
    }

    var icon = os.style.getConfigIcon(config);
    if (icon) {
      this['icon'] = icon;
      this['centerIcon'] = icon;
    }

    var lineDash = os.style.getConfigLineDash(config);
    if (lineDash) {
      this['lineDash'] = lineDash;
    }
  }

  var labelColor = /** @type {Array<number>|string|undefined} */ (feature.get(os.style.StyleField.LABEL_COLOR));
  if (labelColor != null) {
    this['labelColor'] = labelColor;

    if (this['shape'] === os.style.ShapeType.NONE) {
      var colorArray = os.color.toRgbArray(labelColor);
      if (colorArray) {
        this['opacity'] = colorArray[3];
      }
    }
  }

  // when using the 'None' shape, feature opacity will be set to 0 so the label color should be used instead
  var opacityColor = this['shape'] === os.style.ShapeType.NONE ? labelColor : featureColor;
  if (opacityColor) {
    var colorArray = os.color.toRgbArray(opacityColor);
    if (colorArray) {
      this['opacity'] = colorArray[3];
    }
  }

  this['labelSize'] = this.getNumericField_(feature, os.style.StyleField.LABEL_SIZE, os.style.label.DEFAULT_SIZE);

  var showLabels = feature.get(os.style.StyleField.SHOW_LABELS);
  if (showLabels != null) {
    this['showLabels'] = showLabels;
  }

  var geometry = feature.getGeometry();
  if (geometry) {
    this.originalGeometry = geometry;
    altitudeMode = geometry.get(os.data.RecordField.ALTITUDE_MODE) || altitudeMode;
    var type = geometry.getType();

    if (type === ol.geom.GeometryType.POINT) {
      var clone = /** @type {!ol.geom.Point} */ (geometry.clone());
      clone.toLonLat();

      var coordinate = clone.getFirstCoordinate();
      if (coordinate && coordinate.length >= 2) {
        var altitude = coordinate[2] || 0;
        var altUnit = /** @type {string|undefined} */ (feature.get(os.Fields.ALT_UNITS)) || os.math.Units.METERS;

        this['pointGeometry'] = {
          'lon': coordinate[0],
          'lat': coordinate[1],
          'alt': altitude
        };

        this['altitude'] = os.math.convertUnits(altitude, altUnit, os.math.Units.METERS);
        this['altUnits'] = altUnit;

        if (altitude && !altitudeMode) {
          altitudeMode = os.webgl.AltitudeMode.ABSOLUTE;
        }
      }

      this['semiMajor'] = this.getNumericField_(feature, os.Fields.SEMI_MAJOR);
      this['semiMinor'] = this.getNumericField_(feature, os.Fields.SEMI_MINOR);
      this['semiMajorUnits'] = /** @type {string|undefined} */ (feature.get(os.Fields.SEMI_MAJOR_UNITS)) ||
          this['semiMajorUnits'];
      this['semiMinorUnits'] = /** @type {string|undefined} */ (feature.get(os.Fields.SEMI_MINOR_UNITS)) ||
          this['semiMinorUnits'];
      this['orientation'] = this.getNumericField_(feature, os.Fields.ORIENTATION);
    } else if (type === ol.geom.GeometryType.GEOMETRY_COLLECTION) {
      var geom = os.ui.FeatureEditCtrl.getFirstNonCollectionGeometry_(geometry);
      altitudeMode = geom.get(os.data.RecordField.ALTITUDE_MODE) || altitudeMode;
    }
  } else {
    this['pointGeometry'] = {
      'lon': NaN,
      'lat': NaN,
      'alt': NaN
    };
  }

  if (Array.isArray(altitudeMode) && altitudeMode.length) {
    altitudeMode = altitudeMode[0];
  }

  if (altitudeMode && this['altitudeModes'].indexOf(altitudeMode) > -1) {
    this['altitudeMode'] = altitudeMode;
  }

  this['ringOptions'] = /** @type {Object<string, *>} */ (feature.get(os.data.RecordField.RING_OPTIONS));

  if (!this.isFeatureDynamic()) {
    var rotation = feature.get(os.Fields.BEARING);
    if (typeof rotation === 'string' && !goog.string.isEmptyOrWhitespace(rotation)) {
      rotation = Number(rotation);
    }
    if (rotation == null || isNaN(rotation)) {
      rotation = undefined;
    }
    this['iconRotation'] = rotation;
  }

  if (this['labels'].length == 0) {
    // make sure there is at least one blank label so it shows up in the UI
    this['labels'].push(os.style.label.cloneConfig());
  }
};


/**
 * @param {ol.geom.Geometry} geom
 * @return {?ol.geom.Geometry}
 */
os.ui.FeatureEditCtrl.getFirstNonCollectionGeometry_ = function(geom) {
  var type = geom.getType();
  if (type === ol.geom.GeometryType.GEOMETRY_COLLECTION) {
    var geometries = /** @type {ol.geom.GeometryCollection} */ (geom).getGeometriesArray();
    if (geometries.length) {
      geom = os.ui.FeatureEditCtrl.getFirstNonCollectionGeometry_(geometries[0]);
    } else {
      return null;
    }
  }

  return geom;
};


/**
 * Get a numeric field from a feature, returning undefined if the value is not a number.
 *
 * @param {ol.Feature} feature The feature to update
 * @param {string} field The field to retrieve
 * @param {number=} opt_default The default value
 * @return {number|undefined}
 * @private
 */
os.ui.FeatureEditCtrl.prototype.getNumericField_ = function(feature, field, opt_default) {
  var defaultValue = opt_default || undefined;
  var value = Number(feature.get(field));
  return value != null && !isNaN(value) ? value : defaultValue;
};


/**
 * Save the feature configuration to a feature.
 *
 * @param {ol.Feature} feature The feature to update
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.saveToFeature = function(feature) {
  if (feature) {
    this.saveGeometry_(feature);

    feature.set(os.ui.FeatureEditCtrl.Field.NAME, this['name'], true);
    feature.set(os.ui.FeatureEditCtrl.Field.DESCRIPTION, os.ui.text.TuiEditor.render(this['description']), true);
    feature.set(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION, this['description'], true);

    switch (this['dateType']) {
      case os.ui.datetime.AnyDateType.NOTIME:
        feature.set(os.data.RecordField.TIME, undefined, true);
        break;
      case os.ui.datetime.AnyDateType.INSTANT:
        feature.set(os.data.RecordField.TIME, new os.time.TimeInstant(this['startTime']), true);
        break;
      case os.ui.datetime.AnyDateType.RANGE:
        feature.set(os.data.RecordField.TIME, new os.time.TimeRange(this['startTime'], this['endTime']), true);
        break;
      default:
        break;
    }

    var configs;

    // determine where to start with style configs
    if (this.originalProperties_ && this.originalProperties_[os.style.StyleType.FEATURE]) {
      // clone the original configs
      configs = /** @type {Object} */ (os.object.unsafeClone(this.originalProperties_[os.style.StyleType.FEATURE]));
    } else {
      // create a fresh config using a clone of the default vector config
      configs = [os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG)];
    }

    // set the feature style override to the configs
    feature.set(os.style.StyleType.FEATURE, configs, true);

    // set the shape to use and apply shape config
    feature.set(os.style.StyleField.SHAPE, this['shape'], true);
    feature.set(os.style.StyleField.CENTER_SHAPE, this['centerShape'], true);

    if (!this.isFeatureDynamic() && (this.showIcon() || this.showCenterIcon())) {
      feature.set(os.Fields.BEARING, typeof this['iconRotation'] === 'number' ? this['iconRotation'] % 360 : undefined,
          true);
      feature.set(os.style.StyleField.SHOW_ROTATION, true, true);
      feature.set(os.style.StyleField.ROTATION_COLUMN, os.Fields.BEARING, true);
    } else {
      feature.set(os.Fields.BEARING, undefined, true);
      feature.set(os.style.StyleField.SHOW_ROTATION, false, true);
      feature.set(os.style.StyleField.ROTATION_COLUMN, undefined, true);
    }
    os.ui.FeatureEditCtrl.updateFeatureStyle(feature);

    if (Array.isArray(configs)) {
      configs.forEach(function(config) {
        this.setFeatureConfig_(config);
      }, this);
    } else {
      this.setFeatureConfig_(configs);
    }

    // update if the label should be displayed
    if (this['showLabels']) {
      os.feature.showLabel(feature);
    } else {
      os.feature.hideLabel(feature);
    }


    os.ui.FeatureEditCtrl.persistFeatureLabels(feature);
    os.ui.FeatureEditCtrl.restoreFeatureLabels(feature);

    os.style.setFeatureStyle(feature);

    this.updateAltMode(feature);
    os.dispatcher.dispatchEvent(os.action.EventType.SAVE_FEATURE);
  }
};


/**
 * @param {Object} config
 * @private
 */
os.ui.FeatureEditCtrl.prototype.setFeatureConfig_ = function(config) {
  var opacity = os.color.normalizeOpacity(this['opacity']);
  var color = ol.color.asArray(this['color']);
  color[3] = opacity;
  color = os.style.toRgbaString(color);

  // set color/size/line dash
  os.style.setConfigColor(config, color);
  os.style.setConfigSize(config, this['size']);
  os.style.setConfigLineDash(config, this['lineDash']);

  // drop opacity to 0 if the shape style is set to 'None'
  if (this['shape'] === os.style.ShapeType.NONE) {
    os.style.setConfigOpacityColor(config, 0);
  }

  // set fill color for polygons
  if (this.isPolygon()) {
    var fillColor = ol.color.asArray(this['fillColor']);
    var fillOpacity = os.color.normalizeOpacity(this['fillOpacity']);
    fillColor[3] = fillOpacity;
    fillColor = os.style.toRgbaString(fillColor);
    os.style.setFillColor(config, fillColor);
  }

  // set icon config if selected
  var useCenter = this.showCenterIcon();
  if ((this['shape'] === os.style.ShapeType.ICON || useCenter) && config['image'] != null) {
    config['image']['color'] = color;
    config['image']['scale'] = os.style.sizeToScale(this['size']);
    os.style.setConfigIcon(config, useCenter ? this['centerIcon'] : this['icon']);
  }

  // update label fields
  var labelColor = ol.color.asArray(this['labelColor']);
  labelColor[3] = opacity;
  labelColor = os.style.toRgbaString(labelColor);

  config[os.style.StyleField.LABELS] = this['labels'];
  config[os.style.StyleField.LABEL_COLOR] = labelColor;
  config[os.style.StyleField.LABEL_SIZE] = parseInt(this['labelSize'], 10) || os.style.label.DEFAULT_SIZE;
};


/**
 * Save the geometry to a feature.
 *
 * @param {ol.Feature} feature The feature to update
 * @private
 */
os.ui.FeatureEditCtrl.prototype.saveGeometry_ = function(feature) {
  var geom = feature.getGeometry();
  if (this['pointGeometry']) {
    // make sure the coordinate values are numeric
    var lon = Number(this['pointGeometry']['lon']);
    var lat = Number(this['pointGeometry']['lat']);

    var altUnit = this['altUnits'] || os.math.Units.METERS;
    var alt = os.math.convertUnits(Number(this['altitude']) || 0, os.math.Units.METERS, altUnit);

    feature.set(os.Fields.ALT, alt, true);
    feature.set(os.Fields.ALT_UNITS, altUnit, true);

    if (!isNaN(lon) && !isNaN(lat)) {
      var coords = ol.proj.transform([lon, lat, alt], os.proj.EPSG4326, os.map.PROJECTION);
      geom = feature.getGeometry();
      if (!geom || geom === this.originalGeometry) {
        geom = new ol.geom.Point(coords);
      }

      if (geom instanceof ol.geom.SimpleGeometry) {
        geom.setCoordinates(coords);
      }

      feature.setGeometry(geom);

      // update all coordinate fields from the geometry
      os.feature.populateCoordFields(feature, true, undefined, true);

      if (this.isEllipse() && this['semiMajor'] != null && this['semiMinor'] != null && this['orientation'] != null) {
        // set ellipse fields
        feature.set(os.Fields.SEMI_MAJOR, this['semiMajor']);
        feature.set(os.Fields.SEMI_MINOR, this['semiMinor']);
        feature.set(os.Fields.SEMI_MAJOR_UNITS, this['semiMajorUnits']);
        feature.set(os.Fields.SEMI_MINOR_UNITS, this['semiMinorUnits']);
        feature.set(os.Fields.ORIENTATION, this['orientation'] % 360);

        // create the ellipse, replacing the existing ellipse if necessary
        os.feature.createEllipse(feature, true);
      } else {
        // clear ellipse fields on the feature
        feature.set(os.Fields.SEMI_MAJOR, undefined, true);
        feature.set(os.Fields.SEMI_MINOR, undefined, true);
        feature.set(os.Fields.SEMI_MAJOR_UNITS, undefined, true);
        feature.set(os.Fields.SEMI_MINOR_UNITS, undefined, true);
        feature.set(os.Fields.ORIENTATION, undefined, true);
        feature.set(os.data.RecordField.ELLIPSE, undefined, true);
        feature.set(os.data.RecordField.LINE_OF_BEARING, undefined, true);
      }

      // set the ring options
      feature.set(os.data.RecordField.RING_OPTIONS, this['ringOptions']);
      os.feature.createRings(feature, true);

      if (!this.isFeatureDynamic() && (this.showIcon() || this.showCenterIcon()) && this['iconRotation'] != null) {
        feature.set(os.style.StyleField.SHOW_ROTATION, true, true);
        feature.set(os.Fields.BEARING, this['iconRotation'] % 360, true);
        feature.set(os.style.StyleField.ROTATION_COLUMN, os.Fields.BEARING, true);
      } else {
        feature.set(os.Fields.BEARING, undefined, true);
        feature.set(os.style.StyleField.SHOW_ROTATION, false, true);
        feature.set(os.style.StyleField.ROTATION_COLUMN, '', true);
      }
    }
  } else if (this.originalGeometry && (!geom || geom === this.originalGeometry)) {
    geom = this.originalGeometry.clone();
    feature.setGeometry(geom);
  }

  this.updateAltMode(feature);
};


/**
 * @param {ol.Feature} feature
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.updateAltMode = function(feature) {
  var newAltMode = this['altitudeMode'];

  os.feature.forEachGeometry(feature, (g) => {
    let altMode = g.get(os.data.RecordField.ALTITUDE_MODE);
    altMode = Array.isArray(altMode) && altMode.length ? altMode[0] : altMode;

    if (altMode !== newAltMode) {
      os.ui.FeatureEditCtrl.setGeometryRecursive(g, os.data.RecordField.ALTITUDE_MODE, newAltMode, true);
      g.changed();
    }
  });
};


/**
 * @param {ol.geom.Geometry} geom
 * @param {string} field
 * @param {*} value
 * @param {boolean=} opt_silent
 */
os.ui.FeatureEditCtrl.setGeometryRecursive = function(geom, field, value, opt_silent) {
  var type = geom.getType();
  if (type === ol.geom.GeometryType.GEOMETRY_COLLECTION) {
    var geometries = /** @type {ol.geom.GeometryCollection} */ (geom).getGeometriesArray();
    for (var i = 0, n = geometries.length; i < n; i++) {
      os.ui.FeatureEditCtrl.setGeometryRecursive(geometries[i], field, value, opt_silent);
    }
  } else {
    geom.set(field, value, opt_silent);
  }
};


/**
 * Handles column changes
 *
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.onColumnChange = function(event) {
  event.stopPropagation();
  this.updatePreview();
};


/**
 * Handles ring options changes.
 *
 * @param {angular.Scope.Event} event
 * @param {Object<string, *>} options The new ring options.
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.onRingsChange = function(event, options) {
  event.stopPropagation();
  this['ringOptions'] = options;

  this.updatePreview();
};


/**
 * Handle changes to the icon color.
 *
 * @param {string=} opt_new The new color value
 * @param {string=} opt_old The old color value
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onIconColorChange = function(opt_new, opt_old) {
  if (opt_new != opt_old) {
    if (this['labelColor'] == opt_old) {
      this['labelColor'] = opt_new;
    }

    if (this['fillColor'] == opt_old) {
      this['fillColor'] = opt_new;
    }
  }

  this.updatePreview();
};


/**
 * Handle changes to the line dash style.
 *
 * @param {string=} opt_new The new value
 * @param {string=} opt_old The old value
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onLineDashChange = function(opt_new, opt_old) {
  if (opt_new != opt_old && this['lineDash'] == opt_old) {
    this['lineDash'] = opt_new;
  }

  this.updatePreview();
};


/**
 * Handle icon change.
 *
 * @param {angular.Scope.Event} event The Angular event.
 * @param {osx.icon.Icon} value The new value.
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onIconChange = function(event, value) {
  event.stopPropagation();

  this['icon'] = value;
  this['centerIcon'] = value;
  this.updatePreview();
};


/**
 * Handles label color reset
 *
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.onLabelColorReset = function(event) {
  event.stopPropagation();

  this['labelColor'] = this['color'];
  this.updatePreview();
};


/**
 * Handles when the opacity slider has moved
 * @param {angular.Scope.Event} event The Angular event.
 * @param {number} value The new value.
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onOpacityValueChange = function(event, value) {
  event.stopPropagation();

  this['opacity'] = value;
};


/**
 * Handles when the fill opacity is changed
 * @param {angular.Scope.Event} event The Angular event.
 * @param {number} value The new value.
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onFillOpacityChange = function(event, value) {
  event.stopPropagation();

  this['fillOpacity'] = value;
  this.updatePreview();
};


/**
 * Handles when the fill color is changed
 * @param {angular.Scope.Event} event The Angular event.
 * @param {string} value
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onFillColorChange = function(event, value) {
  event.stopPropagation();

  this['fillColor'] = value;
  this.updatePreview();
};


/**
 * Handles fill color reset
 * @param {angular.Scope.Event} event
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onFillColorReset = function(event) {
  event.stopPropagation();

  this['fillColor'] = this['color'];
  this.updatePreview();
};


/**
 * Get the minimum value for the semi-major ellipse axis by converting semi-minor to the semi-major units.
 *
 * @return {number}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.getSemiMajorMin = function() {
  var min = 1e-16;

  if (this['semiMinor'] != null && this['semiMinorUnits'] && this['semiMajorUnits']) {
    min = os.math.convertUnits(this['semiMinor'], this['semiMajorUnits'], this['semiMinorUnits']);
  }

  return min;
};


/**
 * Handle changes to the semi-major or semi-minor axis. This corrects the initial arrow key/scroll value caused by
 * using "1e-16" as the min value to invalidate the form when 0 is used.
 *
 * @export
 */
os.ui.FeatureEditCtrl.prototype.onAxisChange = function() {
  if (this['semiMinor'] === 1e-16) {
    this['semiMinor'] = 1;
  }

  if (this['semiMajor'] === 1e-16) {
    this['semiMajor'] = 1;
  }

  this.updatePreview();
};


/**
 * Launch a window to create or edit a feature.
 *
 * @param {!os.ui.FeatureEditOptions} options
 */
os.ui.launchFeatureEdit = function(options) {
  var windowId = 'featureEdit';
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var scopeOptions = {
      'options': options
    };

    var label = options['label'] ? options['label'] : (options['feature'] ? 'Edit' : 'Add') + ' Feature';
    var icon = options['icon'] ? options['icon'] : 'fa fa-map-marker';
    var windowOptions = {
      'id': windowId,
      'label': label,
      'icon': icon,
      'x': 'center',
      'y': 'center',
      'width': 700,
      'min-width': 400,
      'max-width': 2000,
      'height': 'auto',
      'min-height': 300,
      'max-height': 2000,
      'modal': false,
      'show-close': true
    };

    var template = '<featureedit></featureedit>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};


/**
 * Initialize labels on a place.
 *
 * @param {ol.Feature} feature The feature
 */
os.ui.FeatureEditCtrl.persistFeatureLabels = function(feature) {
  if (feature) {
    var configs = /** @type {Array|Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));
    var config = goog.isArray(configs) ? configs[0] : configs;
    if (config) {
      var labels = config[os.style.StyleField.LABELS];
      var labelNames;
      var showColumns;
      if (labels) {
        var columns = [];
        var show = [];
        for (var i = 0; i < labels.length; i++) {
          if (labels[i]['column']) {
            columns.push(labels[i]['column']);
            show.push(labels[i]['showColumn'] ? '1' : '0');
          }
        }

        if (columns.length > 0) {
          labelNames = columns.join(',');
          showColumns = show.join(',');
        }
      }

      feature.set(os.style.StyleField.LABELS, labelNames, true);
      feature.set(os.style.StyleField.SHOW_LABEL_COLUMNS, showColumns, true);
      feature.set(os.style.StyleField.LABEL_COLOR, config[os.style.StyleField.LABEL_COLOR], true);
      feature.set(os.style.StyleField.LABEL_SIZE, config[os.style.StyleField.LABEL_SIZE], true);
    }
  }
};


/**
 * Initialize labels on a feature.
 *
 * @param {ol.Feature} feature The feature
 */
os.ui.FeatureEditCtrl.restoreFeatureLabels = function(feature) {
  if (feature) {
    var showLabels = feature.get(os.style.StyleField.SHOW_LABELS);
    if (typeof showLabels == 'string' || showLabels === true) {
      feature.set(os.style.StyleField.SHOW_LABELS, showLabels == 'true' || showLabels == '1');
    }

    var configs = /** @type {(Array<Object<string, *>>|Object<string, *>)} */ (
      feature.get(os.style.StyleType.FEATURE));

    if (configs) {
      if (goog.isArray(configs)) {
        configs.forEach(function(config) {
          os.ui.FeatureEditCtrl.restoreFeatureConfigLabels(feature, config);
        });
      } else {
        os.ui.FeatureEditCtrl.restoreFeatureConfigLabels(feature, configs);
      }
    }
  }
};


/**
 * Initialize labels on a feature config.
 *
 * @param {ol.Feature} feature The feature
 * @param {Object<string, *>} config The config
 */
os.ui.FeatureEditCtrl.restoreFeatureConfigLabels = function(feature, config) {
  if (feature && config) {
    var labelNames = feature.get(os.style.StyleField.LABELS);
    var showColumns = feature.get(os.style.StyleField.SHOW_LABEL_COLUMNS);
    if (labelNames) {
      var labels = [];

      var columns = labelNames.split(',');
      var show = showColumns ? showColumns.split(',') : null;
      if (columns) {
        for (var i = 0; i < columns.length; i++) {
          if (columns[i]) {
            labels.push({
              'column': columns[i],
              'showColumn': (show && show[i] == '1')
            });
          }
        }
      }

      config[os.style.StyleField.LABELS] = labels;
    }

    var labelColor = feature.get(os.style.StyleField.LABEL_COLOR);
    if (labelColor) {
      config[os.style.StyleField.LABEL_COLOR] = labelColor;
    }

    var labelSize = feature.get(os.style.StyleField.LABEL_SIZE);
    if (labelSize) {
      config[os.style.StyleField.LABEL_SIZE] = labelSize;
    }
  }
};


/**
 * Updates a feature style if os fields are found on the feature. This allows displaying points and other shapes
 * that aren't supported by KML.
 *
 * @param {ol.Feature} feature The feature to update
 */
os.ui.FeatureEditCtrl.updateFeatureStyle = function(feature) {
  if (feature) {
    var configs = /** @type {Array|Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));
    var config = goog.isArray(configs) ? configs[0] : configs;
    if (config) {
      var shape = /** @type {string|undefined} */ (feature.get(os.style.StyleField.SHAPE));
      if (shape != null) {
        if (os.style.ELLIPSE_REGEXP.test(shape)) {
          // if an ellipse shape is selected, create the ellipse on the feature
          os.feature.createEllipse(feature, true);
        } else if (config['geometry'] === os.data.RecordField.ELLIPSE) {
          // if not, make sure the style isn't configured to render the ellipse geometry
          delete config['geometry'];
        }

        var osShape = os.style.SHAPES[shape];
        if (osShape && osShape['config']) {
          os.object.merge(osShape['config'], config);
        }

        var centerShape = /** @type {string|undefined} */ (feature.get(os.style.StyleField.CENTER_SHAPE));
        var hasCenter = os.style.CENTER_LOOKUP[shape];
        if (centerShape && hasCenter) {
          var centerShapeStyleConfig = os.style.SHAPES[centerShape];
          if (centerShapeStyleConfig && centerShapeStyleConfig['config']) {
            os.object.merge(centerShapeStyleConfig['config'], config);
          }
        }

        // if a shape other than icon is defined, we need to translate the icon config to a vector config
        if (shape != os.style.ShapeType.ICON) {
          goog.asserts.assert(config['image'] != null, 'image config must be defined for icons');
          var image = config['image'];

          // the type wasn't replaced by merging the shape config, so delete it
          if (image['type'] == 'icon') {
            delete image['type'];
          }

          // grab the color/size from the icon configuration
          var color = os.style.toRgbaString(image['color'] || os.style.DEFAULT_LAYER_COLOR);
          var size = image['scale'] ? os.style.scaleToSize(image['scale']) : os.style.DEFAULT_FEATURE_SIZE;
          var lineDash = config['stroke']['lineDash'];
          delete image['scale'];

          // set radius for points on the image config
          image['radius'] = image['radius'] || size;

          // set fill for points on the image config
          image['fill'] = image['fill'] || {};
          image['fill']['color'] = color;

          // set stroke for lines/polygons on the base config
          config['stroke'] = config['stroke'] || {};
          config['stroke']['color'] = color;
          config['stroke']['width'] = config['stroke']['width'] || size;
          config['stroke']['lineDash'] = lineDash;

          // drop opacity to 0 if the shape style is set to 'None'
          if (shape === os.style.ShapeType.NONE) {
            os.style.setConfigOpacityColor(config, 0);
          }
        } else {
          var bearing = /** @type {number} */ (feature.get(os.Fields.BEARING));
          if (!isNaN(bearing)) {
            config['image']['rotation'] = goog.math.toRadians(bearing);

            // when setting the icon rotation, ensure the appropriate rotation columns are set on the feature.
            feature.set(os.style.StyleField.SHOW_ROTATION, true, true);
            feature.set(os.style.StyleField.ROTATION_COLUMN, os.Fields.BEARING, true);
          }
        }
      }
    }
  }
};


/**
 * Gets a human readable name for altitude mode
 * @param {os.webgl.AltitudeMode} altitudeMode - The mode to map to a name
 * @return {string}
 * @export
 */
os.ui.FeatureEditCtrl.prototype.mapAltitudeModeToName = os.webgl.mapAltitudeModeToName;
