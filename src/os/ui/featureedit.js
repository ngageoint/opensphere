goog.provide('os.ui.FeatureEditCtrl');
goog.provide('os.ui.featureEditDirective');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.events.KeyHandler');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEventType');
goog.require('ol.events');
goog.require('ol.geom.Point');
goog.require('os.data.ColumnDefinition');
goog.require('os.map');
goog.require('os.ol.feature');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.ui.Module');
goog.require('os.ui.file.kml');
goog.require('os.ui.geo.PositionEventType');
goog.require('os.ui.geo.positionDirective');
goog.require('os.ui.layer.labelControlsDirective');
goog.require('os.ui.layer.vectorStyleControlsDirective');
goog.require('os.ui.text.simpleMDEDirective');
goog.require('os.ui.window');


/**
 * Directive for editing a feature.
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
 *   name: (string|undefined),
 *   callback: Function
 * }}
 */
os.ui.FeatureEditOptions;



/**
 * Controller function for the featureedit directive
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


  var uid = goog.getUid(this);

  /**
   * @type {string}
   */
  this.scope['featureControlsID'] = uid + 'featureControls';

  /**
   * @type {string}
   */
  this.scope['featureLabelsID'] = uid + 'featureLabels';

  /**
   * @type {string}
   */
  this.scope['featureStyleID'] = uid + 'featureStyle';

  /**
   * @type {Array<string>}
   */
  this.scope['columns'] = [];

  /**
   * The open accordion section.
   * @type {?string}
   * @protected
   */
  this.openSection = '#' + this.scope['featureStyleID'];

  /**
   * Keyboard event handler used while listening for map clicks.
   * @type {goog.events.KeyHandler}
   * @protected
   */
  this.keyHandler = null;

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
  this['color'] = os.style.DEFAULT_LAYER_COLOR;

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
   * The feature icon.
   * @type {!osx.icon.Icon}
   */
  this['icon'] = /** @type {!osx.icon.Icon} */ ({ // os.ui.file.kml.Icon to osx.icon.Icon
    path: os.ui.file.kml.getDefaultIcon().path
  });

  /**
   * The feature center icon.
   * @type {!osx.icon.Icon}
   */
  this['centerIcon'] = /** @type {!osx.icon.Icon} */ ({ // os.ui.file.kml.Icon to osx.icon.Icon
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
   * @type {string}
   */
  this['description'] = '';

  /**
   * @type {string}
   */
  this['name'] = '';

  /**
   * Supported shapes.
   * @type {string}
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
   * Supported shapes.
   * @type {string}
   */
  this['centerShapes'] = [
    os.style.ShapeType.POINT,
    os.style.ShapeType.SQUARE,
    os.style.ShapeType.TRIANGLE,
    os.style.ShapeType.ICON
  ];

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
   * Icon Rotation, in degrees.
   * @type {number|undefined}
   */
  this['iconRotation'] = undefined;

  /**
   * Icon Rotation column, if present
   * @type {string}
   */
  this['rotationColumn'] = '';

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
   * @type {string}
   */
  this['labelColor'] = os.style.DEFAULT_LAYER_COLOR;

  /**
   * @type {number}
   */
  this['labelSize'] = os.style.label.DEFAULT_SIZE;

  var defaultColumns = os.ui.FeatureEditCtrl.FIELDS.filter(function(field) {
    return !os.feature.isInternalField(field);
  }).map(function(col) {
    return new os.data.ColumnDefinition(col);
  });

  /**
   * @type {!Array<string>}
   */
  this['labelColumns'] = defaultColumns;

  /**
   * @type {!Array<!Object>}
   */
  this['labels'] = [];

  /**
   * @type {boolean}
   */
  this['showLabels'] = true;

  /**
   * @type {!os.ui.FeatureEditOptions}
   * @protected
   */
  this.options = /** @type {!os.ui.FeatureEditOptions} */ ($scope['options'] || {});

  /**
   * @type {Function}
   * @protected
   */
  this.callback = this.options['callback'];

  /**
   * Original properties when editing a feature.
   * @type {Object<string, *>}
   * @private
   */
  this.originalProperties_ = null;

  /**
   * The original geometry when editing a feature.
   * @type {ol.geom.Geometry}
   * @private
   */
  this.originalGeometry_ = null;

  var feature = /** @type {ol.Feature|undefined} */ (this.options['feature']);
  if (feature) {
    // grab available columns off the feature source if available, and don't show internal columns
    var source = os.feature.getSource(feature);
    if (source) {
      this['labelColumns'] = source.getColumns().filter(function(column) {
        return !os.feature.isInternalField(column['field']);
      });
    }

    // when editing, we update the existing feature so we don't have to worry about hiding it or overlapping a
    // temporary feature.
    this.previewFeature = feature;
    this.originalProperties_ = feature.getProperties();

    if (this.originalProperties_) {
      // we don't care about or want these sticking around, so remove them
      delete this.originalProperties_[os.style.StyleType.SELECT];
      delete this.originalProperties_[os.style.StyleType.HIGHLIGHT];
      delete this.originalProperties_[os.style.StyleType.LABELS];

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

    this.loadFromFeature_(feature);

    if (this['labels'].length == 0) {
      // make sure there is at least one blank label so it shows up in the UI
      this['labels'].push(os.style.label.cloneConfig());
    }
  } else {
    this.previewFeature = new ol.Feature();
    this.previewFeature.setId(os.ui.FeatureEditCtrl.TEMP_ID);
    this.previewFeature.set(os.data.RecordField.DRAWING_LAYER_NODE, false);

    var name = /** @type {string|undefined} */ (this.options['name']);
    if (name) {
      this.previewFeature.set(os.ui.FeatureEditCtrl.Field.NAME, name, true);
      this['name'] = name;
    }

    var geometry = /** @type {ol.geom.SimpleGeometry|undefined} */ (this.options['geometry']);
    if (!geometry) {
      // new place without a geometry, initialize as a point
      this['pointGeometry'] = {
        'lat': NaN,
        'lon': NaN
      };
    } else if (geometry instanceof ol.geom.Point) {
      // geometry is a point, so allow editing it
      geometry = /** @type {ol.geom.SimpleGeometry} */ (geometry.clone().toLonLat());

      var coordinate = geometry.getFirstCoordinate();
      if (coordinate) {
        this['pointGeometry'] = {
          'lat': coordinate[1],
          'lon': coordinate[0]
        };
      }
    } else {
      // not a point, so disable geometry edit
      this.originalGeometry_ = geometry;
    }

    // default feature to show the name field
    this['labels'].push(goog.object.clone(os.ui.FeatureEditCtrl.DEFAULT_LABEL));
  }

  if (this['pointGeometry']) {
    $scope.$watch('ctrl.pointGeometry.lat', this.updatePreview.bind(this));
    $scope.$watch('ctrl.pointGeometry.lon', this.updatePreview.bind(this));
  }

  $scope.$watch('ctrl.description', this.updatePreview.bind(this));
  $scope.$watch('ctrl.color', this.onIconColorChange.bind(this));
  $scope.$watch('ctrl.opacity', this.updatePreview.bind(this));
  $scope.$watch('ctrl.size', this.updatePreview.bind(this));
  $scope.$watch('ctrl.shape', this.updatePreview.bind(this));
  $scope.$watch('ctrl.centerShape', this.updatePreview.bind(this));
  $scope.$watch('ctrl.labelColor', this.updatePreview.bind(this));
  $scope.$watch('ctrl.labelSize', this.updatePreview.bind(this));
  $scope.$watch('ctrl.showLabels', this.updatePreview.bind(this));
  $scope.$on(os.ui.icon.IconPickerEventType.CHANGE, this.onIconChange.bind(this));
  $scope.$on('labelColor.reset', this.onLabelColorReset.bind(this));
  $scope.$on(os.ui.geo.PositionEventType.MAP_ENABLED, this.onMapEnabled_.bind(this));
  $scope.$on(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE, this.onColumnChange.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));

  $timeout((function() {
    if (this.openSection) {
      // open the style config section
      var section = this.element.find(this.openSection);
      if (section) {
        if (!section.hasClass('in')) {
          section.addClass('in');
          section.siblings('.accordion-heading').addClass('open');
        }
      }
    }

    // notify the window that it can update the size
    $scope.$emit('window.ready');
  }).bind(this), 150);
};
goog.inherits(os.ui.FeatureEditCtrl, goog.Disposable);


/**
 * Identifier used for a temporary preview feature.
 * @type {string}
 * @const
 */
os.ui.FeatureEditCtrl.TEMP_ID = 'features#temporary';


/**
 * Default label.
 * @type {!os.style.label.LabelConfig}
 */
os.ui.FeatureEditCtrl.DEFAULT_LABEL = {
  'column': 'name',
  'showColumn': false
};


/**
 * @enum {string}
 */
os.ui.FeatureEditCtrl.Field = {
  DESCRIPTION: 'description',
  MD_DESCRIPTION: '_mdDescription',
  NAME: 'name'
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
    if (this.previewFeature.getId() == os.ui.FeatureEditCtrl.TEMP_ID) {
      os.MapContainer.getInstance().removeFeature(this.previewFeature, true);
    }

    this.previewFeature = null;
  }

  this.scope = null;
  this.element = null;
};


/**
 * Accept changes, saving the feature.
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
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'accept',
    os.ui.FeatureEditCtrl.prototype.accept);


/**
 * Cancel edit and close the window.
 */
os.ui.FeatureEditCtrl.prototype.cancel = function() {
  var feature = this.options['feature'];
  if (feature && this.originalProperties_) {
    feature.setProperties(this.originalProperties_);
    os.style.setFeatureStyle(feature);

    var layer = os.feature.getLayer(feature);
    if (layer) {
      os.style.notifyStyleChange(layer, [feature]);
    }
  }

  this.close();
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'cancel',
    os.ui.FeatureEditCtrl.prototype.cancel);


/**
 * Close the window.
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Handles key events.
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
 * @return {boolean}
 */
os.ui.FeatureEditCtrl.prototype.isEllipse = function() {
  return os.style.ELLIPSE_REGEXP.test(this['shape']);
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'isEllipse',
    os.ui.FeatureEditCtrl.prototype.isEllipse);


/**
 * If the icon picker should be displayed.
 * @return {boolean}
 */
os.ui.FeatureEditCtrl.prototype.showIcon = function() {
  return this['shape'] === os.style.ShapeType.ICON;
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'showIcon',
    os.ui.FeatureEditCtrl.prototype.showIcon);


/**
 * If the icon picker should be displayed.
 * @return {boolean}
 */
os.ui.FeatureEditCtrl.prototype.showCenterIcon = function() {
  return os.style.CENTER_LOOKUP[this['shape']] && this['centerShape'] === os.style.ShapeType.ICON;
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'showCenterIcon',
    os.ui.FeatureEditCtrl.prototype.showCenterIcon);


/**
 * Handles if map clicks are propagated down to the location form.
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
 */
os.ui.FeatureEditCtrl.prototype.updatePreview = function() {
  if (this.previewFeature) {
    this.saveToFeature(this.previewFeature);

    if (this.previewFeature.getId() == os.ui.FeatureEditCtrl.TEMP_ID) {
      var osMap = os.MapContainer.getInstance();
      osMap.removeFeature(this.previewFeature, false);
      osMap.addFeature(this.previewFeature);
    } else {
      var layer = os.feature.getLayer(this.previewFeature);
      if (layer) {
        os.style.notifyStyleChange(layer, [this.previewFeature]);
      }
    }
  }
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'updatePreview',
    os.ui.FeatureEditCtrl.prototype.updatePreview);


/**
 * Save which section is open to local storage
 * @param {string} selector
 */
os.ui.FeatureEditCtrl.prototype.setOpenSection = function(selector) {
  if (this.openSection) {
    this.element.find(this.openSection).siblings('.accordion-heading').removeClass('open');
  }

  var section = this.element.find(selector);
  if (section) {
    if (this.openSection != selector) {
      section.siblings('.accordion-heading').addClass('open');
      this.openSection = selector;
    } else {
      this.openSection = null;
    }
  }
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'setOpenSection',
    os.ui.FeatureEditCtrl.prototype.setOpenSection);


/**
 * Restore the UI from a feature.
 * @param {!ol.Feature} feature The feature
 * @private
 */
os.ui.FeatureEditCtrl.prototype.loadFromFeature_ = function(feature) {
  this['name'] = feature.get(os.ui.FeatureEditCtrl.Field.NAME);
  this['description'] = feature.get(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION) ||
      feature.get(os.ui.FeatureEditCtrl.Field.DESCRIPTION);

  var featureShape = feature.get(os.style.StyleField.SHAPE);
  if (this['shapes'].indexOf(featureShape) > -1) {
    this['shape'] = featureShape;
  }

  var featureCenterShape = feature.get(os.style.StyleField.CENTER_SHAPE);
  if (this['centerShapes'].indexOf(featureCenterShape) > -1) {
    this['centerShape'] = featureCenterShape;
  }

  var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));
  var featureColor;
  if (config) {
    // if the feature config is an array, assume the first config is the one we want
    if (goog.isArray(config)) {
      config = config[0];
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

    var icon = os.style.getConfigIcon(config);
    if (icon) {
      this['icon'] = icon;
      this['centerIcon'] = icon;
    }

    if (config[os.style.StyleField.LABELS]) {
      this['labels'] = config[os.style.StyleField.LABELS];
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
    this.originalGeometry_ = geometry;

    if (geometry instanceof ol.geom.Point) {
      var clone = /** @type {!ol.geom.Point} */ (geometry.clone());
      clone.toLonLat();

      var coordinate = clone.getFirstCoordinate();
      if (coordinate) {
        this['pointGeometry'] = {
          'lon': coordinate[0],
          'lat': coordinate[1]
        };
      }

      this['semiMajor'] = this.getNumericField_(feature, os.Fields.SEMI_MAJOR);
      this['semiMinor'] = this.getNumericField_(feature, os.Fields.SEMI_MINOR);
      this['semiMajorUnits'] = /** @type {string|undefined} */ (feature.get(os.Fields.SEMI_MAJOR_UNITS)) ||
          this['semiMajorUnits'];
      this['semiMinorUnits'] = /** @type {string|undefined} */ (feature.get(os.Fields.SEMI_MINOR_UNITS)) ||
          this['semiMinorUnits'];
      this['orientation'] = this.getNumericField_(feature, os.Fields.ORIENTATION);
    }
  }

  // use columns if it is a track
  var source = os.feature.getSource(feature);
  if (os.instanceOf(source, plugin.track.TrackSource.NAME)) {
    source = /** @type {!os.source.Vector} */ (source);
    this.scope['columns'] = os.ui.layer.getColumnsFromSource(source);
  }

  if (this.scope['columns'].length > 0) {
    this['rotationColumn'] = feature.get(os.style.StyleField.ROTATION_COLUMN) || '';
    if (goog.string.isEmpty(this['rotationColumn']) && source.hasColumn(os.Fields.BEARING)) { // autodetect
      this['rotationColumn'] = os.Fields.BEARING;
    }
  } else {
    this['iconRotation'] = this.getNumericField_(feature, os.Fields.BEARING);
  }

  this.updatePreview();
};


/**
 * Get a numeric field from a feature, returning undefined if the value is not a number.
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
 * @param {ol.Feature} feature The feature to update
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.saveToFeature = function(feature) {
  if (feature) {
    this.saveGeometry_(feature);

    feature.set(os.ui.FeatureEditCtrl.Field.NAME, this['name']);
    feature.set(os.ui.FeatureEditCtrl.Field.DESCRIPTION,
        os.ui.text.SimpleMDE.removeMarkdown(this['description'], true));
    feature.set(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION, this['description']);

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
    feature.set(os.style.StyleType.FEATURE, configs);

    // set the shape to use and apply shape config
    feature.set(os.style.StyleField.SHAPE, this['shape']);
    feature.set(os.style.StyleField.CENTER_SHAPE, this['centerShape']);

    if (this.scope['columns'].length < 1) {
      feature.set(os.Fields.BEARING, this['iconRotation'] % 360);
      feature.set(os.style.StyleField.SHOW_ROTATION, this.showIcon() || this.showCenterIcon());
      feature.set(os.style.StyleField.ROTATION_COLUMN, os.Fields.BEARING);
    } else {
      feature.set(os.style.StyleField.SHOW_ROTATION, !goog.string.isEmpty(this.scope['columns']));
      feature.set(os.style.StyleField.ROTATION_COLUMN, this['rotationColumn']);
    }
    os.ui.FeatureEditCtrl.updateFeatureStyle(feature);

    if (configs instanceof Array) {
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

  // set color/size
  os.style.setConfigColor(config, color);
  os.style.setConfigSize(config, this['size']);

  // drop opacity to 0 if the shape style is set to 'None'
  if (this['shape'] === os.style.ShapeType.NONE) {
    os.style.setConfigOpacityColor(config, 0);
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
 * @param {ol.Feature} feature The feature to update
 * @private
 */
os.ui.FeatureEditCtrl.prototype.saveGeometry_ = function(feature) {
  if (this['pointGeometry']) {
    // make sure the coordinate values are numeric
    var lon = Number(this['pointGeometry']['lon']);
    var lat = Number(this['pointGeometry']['lat']);

    if (!isNaN(lon) && !isNaN(lat)) {
      var point = new ol.geom.Point([lon, lat]);
      point.osTransform();
      feature.setGeometry(point);

      // update all coordinate fields from the geometry
      os.feature.populateCoordFields(feature, true);

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
        feature.set(os.Fields.SEMI_MAJOR, undefined);
        feature.set(os.Fields.SEMI_MINOR, undefined);
        feature.set(os.Fields.SEMI_MAJOR_UNITS, undefined);
        feature.set(os.Fields.SEMI_MINOR_UNITS, undefined);
        feature.set(os.Fields.ORIENTATION, undefined);
        feature.set(os.data.RecordField.ELLIPSE, undefined);
        feature.set(os.data.RecordField.LINE_OF_BEARING, undefined);
      }

      if ((this.showIcon() || this.showCenterIcon()) &&
          ((this['iconRotation'] != null && this.scope['columns'].length < 1) || this.scope['columns'].length > 0)) {
        feature.set(os.style.StyleField.SHOW_ROTATION, true);
        if (this.scope['columns'].length < 1) {
          feature.set(os.Fields.BEARING, this['iconRotation'] % 360);
          this['rotationColumn'] = os.Fields.BEARING;
        }
        feature.set(os.style.StyleField.ROTATION_COLUMN, this['rotationColumn']);
      } else {
        feature.set(os.Fields.BEARING, undefined);
        feature.set(os.style.StyleField.SHOW_ROTATION, false);
        feature.set(os.style.StyleField.ROTATION_COLUMN, '');
      }
    }
  } else if (this.originalGeometry_) {
    feature.setGeometry(this.originalGeometry_.clone());
  }
};


/**
 * Handles column changes
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.onColumnChange = function(event) {
  event.stopPropagation();
  this.updatePreview();
};


/**
 * Handle changes to the icon color.
 * @param {string=} opt_new The new color value
 * @param {string=} opt_old The old color value
 */
os.ui.FeatureEditCtrl.prototype.onIconColorChange = function(opt_new, opt_old) {
  if (opt_new != opt_old && this['labelColor'] == opt_old) {
    this['labelColor'] = opt_new;
  }

  this.updatePreview();
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'onIconColorChange',
    os.ui.FeatureEditCtrl.prototype.onIconColorChange);


/**
 * Handle icon change.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {osx.icon.Icon} value The new value.
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.onIconChange = function(event, value) {
  event.stopPropagation();

  this['icon'] = value;
  this['centerIcon'] = value;
  this.updatePreview();
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'onIconChange',
    os.ui.FeatureEditCtrl.prototype.onIconChange);


/**
 * Handles label color reset
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.FeatureEditCtrl.prototype.onLabelColorReset = function(event) {
  event.stopPropagation();

  this['labelColor'] = this['color'];
  this.updatePreview();
};


/**
 * Get the minimum value for the semi-major ellipse axis by converting semi-minor to the semi-major units.
 * @return {number}
 */
os.ui.FeatureEditCtrl.prototype.getSemiMajorMin = function() {
  var min = 1e-16;

  if (this['semiMinor'] != null && this['semiMinorUnits'] && this['semiMajorUnits']) {
    min = os.math.convertUnits(this['semiMinor'], this['semiMajorUnits'], this['semiMinorUnits']);
  }

  return min;
};
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'getSemiMajorMin',
    os.ui.FeatureEditCtrl.prototype.getSemiMajorMin);


/**
 * Handle changes to the semi-major or semi-minor axis. This corrects the initial arrow key/scroll value caused by
 * using "1e-16" as the min value to invalidate the form when 0 is used.
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
goog.exportProperty(
    os.ui.FeatureEditCtrl.prototype,
    'onAxisChange',
    os.ui.FeatureEditCtrl.prototype.onAxisChange);


/**
 * Launch a window to create or edit a feature.
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

      feature.set(os.style.StyleField.LABELS, labelNames);
      feature.set(os.style.StyleField.SHOW_LABEL_COLUMNS, showColumns);
      feature.set(os.style.StyleField.LABEL_COLOR, config[os.style.StyleField.LABEL_COLOR]);
      feature.set(os.style.StyleField.LABEL_SIZE, config[os.style.StyleField.LABEL_SIZE]);
    }
  }
};


/**
 * Initialize labels on a feature.
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

          // drop opacity to 0 if the shape style is set to 'None'
          if (shape == os.style.ShapeType.NONE) {
            os.style.setConfigOpacityColor(config, 0);
          }
        } else {
          var source = os.feature.getSource(feature);
          var rotationColumn = os.instanceOf(source, plugin.track.TrackSource.NAME) ?
              feature.get(os.style.StyleField.ROTATION_COLUMN) : os.Fields.BEARING;
          config['image']['rotation'] =
              goog.math.toRadians(/** @type {number} */ (feature.get(/** @type {string} */ (rotationColumn))));
        }
      }
    }
  }
};
