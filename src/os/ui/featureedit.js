goog.declareModuleId('os.ui.FeatureEditUI');

import {asArray} from 'ol/src/color.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import {getCenter} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Point from 'ol/src/geom/Point.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';
import {transform} from 'ol/src/proj.js';
import {getUid} from 'ol/src/util.js';

import './geo/position.js';
import './geo/ringoptions.js';
import './layer/labelcontrols.js';
import './layer/vectorstylecontrols.js';
import './listui.js';
import './text/tuieditorui.js';
import './util/validationmessage.js';
import EventType from '../action/eventtype.js';
import {EventType as AnnotationEventType} from '../annotation/annotation.js';
import {normalizeOpacity, toHexString, toRgbArray} from '../color.js';
import ColumnDefinition from '../data/columndefinition.js';
import RecordField from '../data/recordfield.js';
import * as dispatcher from '../dispatcher.js';
import {getFunctionalExtent} from '../extent.js';
import DynamicFeature from '../feature/dynamicfeature.js';
import * as osFeature from '../feature/feature.js';
import Fields from '../fields/fields.js';
import {DEFAULT_SEMI_MAJ_COL_NAME, DEFAULT_SEMI_MIN_COL_NAME} from '../fields/index.js';
import MappingManager from '../im/mapping/mappingmanager.js';
import {ModifyEventType} from '../interaction/interaction.js';
import Modify from '../interaction/modifyinteraction.js';
import * as interpolate from '../interpolate.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {convertUnits} from '../math/math.js';
import Units from '../math/units.js';
import {merge, unsafeClone} from '../object/object.js';
import {ROOT} from '../os.js';
import {EPSG4326} from '../proj/proj.js';
import {DEFAULT_SIZE, cloneConfig, updateShown} from '../style/label.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleType from '../style/styletype.js';
import TimeInstant from '../time/timeinstant.js';
import TimeRange from '../time/timerange.js';
import AltitudeMode from '../webgl/altitudemode.js';
import {mapAltitudeModeToName} from '../webgl/webgl.js';
import * as AnyDateUI from './datetime/anydate.js';
import AnyDateType from './datetime/anydatetype.js';
import FeatureEditField from './featureeditfield.js';
import {GOOGLE_EARTH_ICON_SET, getDefaultIcon, replaceGoogleUri} from './file/kml/kml.js';
import {getRingTitle} from './geo/geo.js';
import PositionEventType from './geo/positioneventtype.js';
import IconPickerEventType from './icon/iconpickereventtype.js';
import LabelControlsEventType from './layer/labelcontrolseventtype.js';
import Module from './module.js';
import * as TuiEditor from './text/tuieditor.js';
import * as osWindow from './window.js';
import WindowEventType from './windoweventtype.js';
import windowSelector from './windowselector.js';

const Disposable = goog.require('goog.Disposable');
const {assert} = goog.require('goog.asserts');
const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const {add: addClass} = goog.require('goog.dom.classlist');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const {toRadians} = goog.require('goog.math');
const {isEmptyOrWhitespace} = goog.require('goog.string');

const {default: PayloadEvent} = goog.requireType('os.events.PayloadEvent');
const {default: Method} = goog.requireType('os.interpolate.Method');
const {LabelConfig} = goog.requireType('os.style.label');
const {default: AnyDateHelp} = goog.requireType('os.ui.datetime.AnyDateHelp');


/**
 * Directive for editing a feature.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/windows/featureedit.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureedit';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * @typedef {{
 *   feature: (Feature|undefined),
 *   geometry: (SimpleGeometry|undefined),
 *   label: (string|undefined),
 *   name: (string|undefined),
 *   callback: Function
 * }}
 */
let FeatureEditOptions;

/**
 * Controller function for the featureedit directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super();

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
     * @type {Feature}
     * @protected
     */
    this.previewFeature = null;

    /**
     * Keyboard event handler used while listening for map clicks.
     * @type {KeyHandler}
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
    this.tempFeatureId = Controller.TEMP_ID + this['uid'];

    /**
     * Help tooltips.
     * @type {!Object<string, string>}
     */
    this['help'] = {
      'semiMajor': 'Semi-major axis of the ellipse in the specified units.',
      'semiMinor': 'Semi-minor axis of the ellipse in the specified units.',
      'orientation': 'Orientation of the ellipse in degrees from north between 0° and 360°. Values outside this ' +
          'range will be adjusted automatically.',
      'iconRotation': 'Rotation of the icon in degrees from north between 0° and 360°. Values outside this range ' +
          'will be adjusted automatically.'
    };

    /**
     * The feature color.
     * @type {string}
     */
    this['color'] = toHexString(osStyle.DEFAULT_LAYER_COLOR);

    /**
     * The feature opacity.
     * @type {string}
     */
    this['opacity'] = osStyle.DEFAULT_ALPHA;

    /**
     * The feature size.
     * @type {number}
     */
    this['size'] = osStyle.DEFAULT_FEATURE_SIZE;

    /**
     * The feature fill color
     * @type {string}
     */
    this['fillColor'] = toHexString(osStyle.DEFAULT_LAYER_COLOR);

    /**
     * The feature fill opacity
     * @type {string}
     */
    this['fillOpacity'] = osStyle.DEFAULT_FILL_ALPHA;

    /**
     * The feature icon.
     * @type {!osx.icon.Icon}
     */
    this['icon'] = /** @type {!osx.icon.Icon} */ ({// Icon to osx.icon.Icon
      title: getDefaultIcon().title,
      path: getDefaultIcon().path,
      options: getDefaultIcon().options
    });

    /**
     * The feature center icon.
     * @type {!osx.icon.Icon}
     */
    this['centerIcon'] = /** @type {!osx.icon.Icon} */ ({// Icon to osx.icon.Icon
      path: getDefaultIcon().path
    });

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
     * The feature geometry.
     * @type {osx.geo.Location}
     */
    this['pointGeometry'] = null;

    /**
     * @type {!AnyDateType}
     */
    this['dateType'] = AnyDateType.NOTIME;

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
      osStyle.ShapeType.NONE,
      osStyle.ShapeType.POINT,
      osStyle.ShapeType.SQUARE,
      osStyle.ShapeType.TRIANGLE,
      osStyle.ShapeType.ICON,
      osStyle.ShapeType.ELLIPSE,
      osStyle.ShapeType.ELLIPSE_CENTER
    ];

    /**
     * Selected shape.
     * @type {string}
     */
    this['shape'] = osStyle.ShapeType.POINT;

    /**
     * Supported center shapes.
     * @type {Array}
     */
    this['centerShapes'] = [
      osStyle.ShapeType.POINT,
      osStyle.ShapeType.SQUARE,
      osStyle.ShapeType.TRIANGLE,
      osStyle.ShapeType.ICON
    ];

    /**
     * Selected line dash style
     */
    this['lineDash'] = undefined;

    /**
     * Selected shape.
     * @type {string}
     */
    this['centerShape'] = osStyle.ShapeType.POINT;

    /**
     * Ellipse semi-major axis.
     * @type {number|undefined}
     */
    this['semiMajor'] = undefined;

    /**
     * Ellipse semi-major axis units.
     * @type {string}
     */
    this['semiMajorUnits'] = Units.NAUTICAL_MILES;

    /**
     * Ellipse semi-minor axis.
     * @type {number|undefined}
     */
    this['semiMinor'] = undefined;

    /**
     * Ellipse semi-minor axis units.
     * @type {string}
     */
    this['semiMinorUnits'] = Units.NAUTICAL_MILES;

    /**
     * Ellipse orientation, in degrees.
     * @type {number|undefined}
     */
    this['orientation'] = undefined;

    /**
     * The ring options.
     * @type {?osx.feature.RingOptions}
     */
    this['ringOptions'] = null;

    /**
     * @type {string}
     */
    this['ringTitle'] = getRingTitle();

    /**
     * Icon Rotation, in degrees.
     * @type {number|undefined}
     */
    this['iconRotation'] = undefined;

    /**
     * Supported ellipse axis units.
     * @type {!Array<!Units>}
     */
    this['units'] = [
      Units.NAUTICAL_MILES,
      Units.MILES,
      Units.KILOMETERS,
      Units.METERS
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
    this['altUnits'] = Units.METERS;

    /**
     * Altitude unit options.
     * @type {string}
     */
    this['altUnitOptions'] = Object.values(Units);

    /**
     * The altitude modes supported
     * @type {Array<AltitudeMode>}
     */
    this['altitudeModes'] = Object.values(AltitudeMode);

    var webGLRenderer = getMapContainer().getWebGLRenderer();
    if (webGLRenderer) {
      this['altitudeModes'] = webGLRenderer.getAltitudeModes();
    }

    var defaultAltMode = AltitudeMode.CLAMP_TO_GROUND;

    /**
     * The selected altitude mode
     * @type {?AltitudeMode}
     */
    this['altitudeMode'] = this['altitudeModes'].indexOf(defaultAltMode) > -1 ? defaultAltMode : null;

    /**
     * Configured label color.
     * @type {string}
     */
    this['labelColor'] = toHexString(osStyle.DEFAULT_LAYER_COLOR);

    /**
     * Configured label size.
     * @type {number}
     */
    this['labelSize'] = DEFAULT_SIZE;

    var defaultColumns = Controller.FIELDS.filter(function(field) {
      return !osFeature.isInternalField(field);
    }).map(function(col) {
      return new ColumnDefinition(col);
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
     * The Always Show Labels control value.
     * @type {boolean}
     */
    this['showLabels'] = false;

    /**
     * Time help content.
     * @type {AnyDateHelp}
     */
    this['timeHelp'] = {
      title: 'Time Selection',
      content: 'Add a time to enable interaction with the Timeline. ' +
          'If \'No Time\' is selected, the Place will always be visible',
      pos: 'right'
    };

    /**
     * The feature edit options.
     * @type {!FeatureEditOptions}
     * @protected
     */
    this.options = /** @type {!FeatureEditOptions} */ ($scope['options'] || {});

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
     * @type {Geometry}
     * @protected
     */
    this.originalGeometry = null;

    /**
     * Interaction for freeform modification.
     * @type {Modify}
     */
    this.interaction = null;

    var feature = /** @type {Feature|undefined} */ (this.options['feature']);
    if (feature) {
      // grab available columns off the feature source if available, and don't show internal columns
      var source = osFeature.getSource(feature);
      if (source) {
        this['labelColumns'] = source.getColumnsArray().filter(function(column) {
          return !osFeature.isInternalField(column['field']);
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
        delete this.originalProperties_[StyleType.SELECT];
        delete this.originalProperties_[StyleType.HIGHLIGHT];
        delete this.originalProperties_[StyleType.LABEL];

        // if a feature config exists, create a deep clone of it so the correct config is restored on cancel
        var oldConfig = this.originalProperties_[StyleType.FEATURE];
        if (oldConfig) {
          this.originalProperties_[StyleType.FEATURE] = unsafeClone(oldConfig);
        }

        if (!this.originalProperties_[StyleField.LABEL_COLOR]) {
          this.originalProperties_[StyleField.LABEL_COLOR] = undefined;
        }

        if (!this.originalProperties_[StyleField.LABEL_SIZE]) {
          this.originalProperties_[StyleField.LABEL_SIZE] = undefined;
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

    $scope.$on(WindowEventType.CANCEL, this.onCancel.bind(this));
    $scope.$on(IconPickerEventType.CHANGE, this.onIconChange.bind(this));
    $scope.$on('labelColor.reset', this.onLabelColorReset.bind(this));
    $scope.$on(PositionEventType.MAP_ENABLED, this.onMapEnabled_.bind(this));
    $scope.$on(LabelControlsEventType.COLUMN_CHANGE, this.onColumnChange.bind(this));
    $scope.$on('ring.update', this.onRingsChange.bind(this));

    $scope.$on(AnyDateUI.Controller.CHANGE, function(event, instant, start, end) {
      event.stopPropagation();

      if (start || end) {
        this['dateType'] = AnyDateType.RANGE;
        this['startTime'] = (new Date(start)).getTime();
        this['endTime'] = (new Date(end)).getTime();
      } else if (instant) {
        this['dateType'] = AnyDateType.INSTANT;
        this['startTime'] = (new Date(instant)).getTime();
        this['endTime'] = undefined;
      } else {
        this['dateType'] = AnyDateType.NOTIME;
        this['startTime'] = undefined;
        this['endTime'] = undefined;
      }

      this.updatePreview();
    }.bind(this));

    $scope.$on('$destroy', this.dispose.bind(this));

    // fire an event to inform other UIs that an edit has launched.
    dispatcher.getInstance().dispatchEvent(AnnotationEventType.LAUNCH_EDIT);

    $scope.$on(TuiEditor.READY, function() {
      $timeout(function() {
        // expand the default section if set
        if (this.defaultExpandedOptionsId) {
          var el = document.getElementById(this.defaultExpandedOptionsId);
          if (el) {
            addClass(el, 'show');
          }
        }

        // notify the window that it can update the size
        $scope.$emit(WindowEventType.READY);
      }.bind(this));
    }.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.keyHandler);
    this.keyHandler = null;

    if (this.mapListenKey) {
      unlistenByKey(this.mapListenKey);
      this.mapListenKey = null;
    }

    if (this.windowToggle) {
      this.windowToggle();
      this.windowToggle = null;
    }

    if (this.previewFeature) {
      if (this.previewFeature.getId() == this.tempFeatureId) {
        getMapContainer().removeFeature(this.previewFeature);
      }

      this.previewFeature = null;
    }

    dispose(this.interaction);

    this.scope = null;
    this.element = null;
  }

  /**
   * Accept changes, saving the feature.
   *
   * @export
   */
  accept() {
    // create a new feature if necessary
    var feature = this.options['feature'] = this.options['feature'] || new Feature();
    feature.unset(RecordField.DRAWING_LAYER_NODE, true);

    // filter out empty labels when the feature is saved
    if (this['labels']) {
      this['labels'] = this['labels'].filter(function(label) {
        return label['column'] != null;
      });
    }

    this.saveToFeature(feature);

    if (!feature.getId()) {
      feature.setId(getUid(feature));
    }

    if (this.callback) {
      this.callback(this.options);
    }

    this.close();
  }

  /**
   * Cancel edit and close the window.
   *
   * @export
   */
  cancel() {
    this.onCancel();
    this.close();
  }

  /**
   * Handler for canceling the edit. This restores the state of the feature to what it was before any live
   * edits were applied while the form was up. It's called on clicking both the cancel button and the window X.
   */
  onCancel() {
    var feature = this.options['feature'];
    if (feature && this.originalProperties_) {
      feature.setProperties(this.originalProperties_);
      osStyle.setFeatureStyle(feature);

      var layer = osFeature.getLayer(feature);
      if (layer) {
        osStyle.notifyStyleChange(layer, [feature]);
      }
    }

    dispatcher.getInstance().dispatchEvent(EventType.RESTORE_FEATURE);
  }

  /**
   * Close the window.
   *
   * @protected
   */
  close() {
    osWindow.close(this.element);
  }

  /**
   * Handles key events.
   *
   * @param {KeyEvent} event
   * @protected
   */
  handleKeyEvent(event) {
    switch (event.keyCode) {
      case KeyCodes.ESC:
        // cancel position selection
        if (this.scope) {
          this.scope.$broadcast(PositionEventType.MAP_ENABLED, false, 'pointGeometry');
        }
        break;
      default:
        break;
    }
  }

  /**
   * If an ellipse shape is selected.
   *
   * @return {boolean}
   * @export
   */
  isEllipse() {
    return osStyle.ELLIPSE_REGEXP.test(this['shape']);
  }

  /**
   * If the feature has a polygonal geometry.
   *
   * @return {boolean}
   * @export
   */
  isPolygon() {
    return osFeature.hasPolygon(this.previewFeature);
  }

  /**
   * If the feature has a line or polygonal geometry.
   *
   * @return {boolean}
   * @export
   */
  isPolygonOrLine() {
    if (this.previewFeature) {
      var geometry = this.previewFeature.getGeometry();
      if (geometry) {
        var type = geometry.getType();

        return type == GeometryType.POLYGON || type == GeometryType.MULTI_POLYGON ||
          type == GeometryType.LINE_STRING || type == GeometryType.MULTI_LINE_STRING;
      }
    }

    return false;
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

  /**
   * If the feature is dynamic, which means it is a time based track
   *
   * @return {boolean}
   * @export
   */
  isFeatureDynamic() {
    var feature = /** @type {Feature|undefined} */ (this.options['feature']);
    return feature instanceof DynamicFeature;
  }

  /**
   * Handles if map clicks are propagated down to the location form.
   *
   * @param {angular.Scope.Event} event The Angular event
   * @param {boolean} isEnabled If the map should be used for location clicks.
   * @private
   */
  onMapEnabled_(event, isEnabled) {
    if (event.targetScope !== this.scope) {
      // only handle the event if it wasn't fired from this controller
      event.stopPropagation();

      if (isEnabled) {
        // listen for a mouse click on the map
        if (!this.mapListenKey) {
          var map = getMapContainer().getMap();
          this.mapListenKey = listen(map, MapBrowserEventType.SINGLECLICK, this.onMapClick_, this);
        }

        // hide all windows so it's easier to click a position
        this.windowToggle = osWindow.toggleVisibility();

        // listen for ESC to cancel waiting for a mouse click
        if (!this.keyHandler) {
          this.keyHandler = new KeyHandler(getDocument());
          this.keyHandler.listen(KeyEvent.EventType.KEY, this.handleKeyEvent, false, this);
        }
      } else {
        dispose(this.keyHandler);
        this.keyHandler = null;

        if (this.mapListenKey) {
          unlistenByKey(this.mapListenKey);
          this.mapListenKey = null;
        }

        if (this.windowToggle) {
          this.windowToggle();
          this.windowToggle = null;
        }
      }
    }
  }

  /**
   * Handle map browser events.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} 'false' to stop event propagation
   * @private
   */
  onMapClick_(mapBrowserEvent) {
    if (mapBrowserEvent.type == MapBrowserEventType.SINGLECLICK &&
        mapBrowserEvent.coordinate && mapBrowserEvent.coordinate.length > 1) {
      // This UI will do everything in lon/lat
      var coordinate = transform(mapBrowserEvent.coordinate, osMap.PROJECTION, EPSG4326);
      this.scope.$broadcast(PositionEventType.MAP_CLICK, coordinate, true);
      this.updatePreview();
    }

    return false;
  }

  /**
   * Updates the temporary feature style.
   *
   * @export
   */
  updatePreview() {
    if (this.previewFeature) {
      this.saveToFeature(this.previewFeature);

      if (this.previewFeature.getId() === this.tempFeatureId) {
        const mapContainer = getMapContainer();
        mapContainer.removeFeature(this.previewFeature);
        mapContainer.addFeature(this.previewFeature);
      }

      var layer = osFeature.getLayer(this.previewFeature);
      if (layer) {
        osStyle.notifyStyleChange(layer, [this.previewFeature]);
      }
    }
  }

  /**
   * Create a default preview feature.
   *
   * @protected
   */
  createPreviewFeature() {
    this.previewFeature = new Feature();
    this.previewFeature.enableEvents();
    this.previewFeature.setId(this.tempFeatureId);
    this.previewFeature.set(RecordField.DRAWING_LAYER_NODE, false);

    var name = /** @type {string|undefined} */ (this.options['name']);
    if (name) {
      this.previewFeature.set(FeatureEditField.NAME, name, true);
      this['name'] = name;
    }

    var geometry = /** @type {SimpleGeometry|undefined} */ (this.options['geometry']);
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
      case GeometryType.POINT:
        // geometry is a point, so allow editing it
        geometry = /** @type {Point} */ (geometry.clone().toLonLat());

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
    this['labels'].push(Object.assign({}, Controller.DEFAULT_LABEL));
  }

  /**
   * Restore the UI from a feature.
   *
   * @param {!Feature} feature The feature
   * @protected
   */
  loadFromFeature(feature) {
    this['name'] = feature.get(FeatureEditField.NAME);
    this['description'] = feature.get(FeatureEditField.MD_DESCRIPTION) ||
        feature.get(FeatureEditField.DESCRIPTION);

    var time = feature.get(RecordField.TIME);
    if (time) {
      this['startTime'] = time.getStart();
      this['startTimeISO'] = this['startTime'] ? new Date(this['startTime']).toISOString() : undefined;
      this['endTime'] = time.getEnd() === this['startTime'] ? undefined : time.getEnd();
      this['endTimeISO'] = this['endTime'] ? new Date(this['endTime']).toISOString() : undefined;
      if (this['endTime'] > this['startTime']) {
        this['dateType'] = AnyDateType.RANGE;
      } else {
        this['dateType'] = AnyDateType.INSTANT;
      }
    } else {
      this['dateType'] = AnyDateType.NOTIME;
    }

    var featureShape = feature.get(StyleField.SHAPE);
    if (this['shapes'].indexOf(featureShape) > -1) {
      this['shape'] = featureShape;
    }

    var featureCenterShape = feature.get(StyleField.CENTER_SHAPE);
    if (this['centerShapes'].indexOf(featureCenterShape) > -1) {
      this['centerShape'] = featureCenterShape;
    }

    var altitudeMode = feature.get(RecordField.ALTITUDE_MODE);

    var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));
    var featureColor;
    if (config) {
      if (Array.isArray(config)) {
        // locate the label config in the array
        var labelsConfig = config.find(osStyle.isLabelConfig);
        if (labelsConfig) {
          this['labels'] = labelsConfig[StyleField.LABELS];
        }

        // if the feature config is an array, assume the first config has the style info we want
        config = config[0];
      } else if (config[StyleField.LABELS]) {
        this['labels'] = config[StyleField.LABELS];
      }

      var size = osStyle.getConfigSize(config);
      if (size) {
        this['size'] = size;
      }

      featureColor = /** @type {Array<number>|string|undefined} */ (osStyle.getConfigColor(config));
      if (featureColor) {
        this['color'] = toHexString(featureColor);
        this['labelColor'] = this['color'];
      }

      // initialize fill color and opacity
      if (config['fill'] && config['fill']['color']) {
        // use the color from config
        this['fillColor'] = toHexString(config['fill']['color']);
        this['fillOpacity'] = toRgbArray(config['fill']['color'])[3];
      } else {
        // use default values
        this['fillColor'] = toHexString(osStyle.DEFAULT_LAYER_COLOR);
        this['fillOpacity'] = osStyle.DEFAULT_FILL_ALPHA;
      }

      var icon = osStyle.getConfigIcon(config);
      if (icon) {
        this['icon'] = icon;
        this['centerIcon'] = icon;
      }

      var lineDash = osStyle.getConfigLineDash(config);
      if (lineDash) {
        this['lineDash'] = lineDash;
      }
    }

    var labelColor = /** @type {Array<number>|string|undefined} */ (feature.get(StyleField.LABEL_COLOR));
    if (labelColor != null) {
      this['labelColor'] = labelColor;

      if (this['shape'] === osStyle.ShapeType.NONE) {
        var colorArray = toRgbArray(labelColor);
        if (colorArray) {
          this['opacity'] = colorArray[3];
        }
      }
    }

    // when using the 'None' shape, feature opacity will be set to 0 so the label color should be used instead
    var opacityColor = this['shape'] === osStyle.ShapeType.NONE ? labelColor : featureColor;
    if (opacityColor) {
      var colorArray = toRgbArray(opacityColor);
      if (colorArray) {
        this['opacity'] = colorArray[3];
      }
    }

    this['labelSize'] = this.getNumericField_(feature, StyleField.LABEL_SIZE, DEFAULT_SIZE);

    var showLabels = feature.get(RecordField.FORCE_SHOW_LABEL);
    if (showLabels != null) {
      this['showLabels'] = showLabels;
    }

    var geometry = feature.getGeometry();
    if (geometry) {
      this.originalGeometry = geometry;
      altitudeMode = geometry.get(RecordField.ALTITUDE_MODE) || altitudeMode;
      var type = geometry.getType();

      if (type === GeometryType.POINT) {
        var clone = /** @type {!Point} */ (geometry.clone());
        clone.toLonLat();

        var coordinate = clone.getFirstCoordinate();
        if (coordinate && coordinate.length >= 2) {
          var altitude = coordinate[2] || 0;
          var altUnit = /** @type {string|undefined} */ (feature.get(Fields.ALT_UNITS)) || Units.METERS;

          this['pointGeometry'] = {
            'lon': coordinate[0],
            'lat': coordinate[1],
            'alt': altitude
          };

          this['altitude'] = convertUnits(altitude, altUnit, Units.METERS);
          this['altUnits'] = altUnit;

          if (altitude && !altitudeMode) {
            altitudeMode = AltitudeMode.ABSOLUTE;
          }
        }

        this['semiMajor'] = this.getNumericField_(feature, Fields.SEMI_MAJOR);
        this['semiMinor'] = this.getNumericField_(feature, Fields.SEMI_MINOR);
        this['semiMajorUnits'] = /** @type {string|undefined} */ (feature.get(Fields.SEMI_MAJOR_UNITS)) ||
            this['semiMajorUnits'];
        this['semiMinorUnits'] = /** @type {string|undefined} */ (feature.get(Fields.SEMI_MINOR_UNITS)) ||
            this['semiMinorUnits'];
        this['orientation'] = this.getNumericField_(feature, Fields.ORIENTATION);
      } else if (type === GeometryType.GEOMETRY_COLLECTION) {
        var geom = Controller.getFirstNonCollectionGeometry_(geometry);
        altitudeMode = geom.get(RecordField.ALTITUDE_MODE) || altitudeMode;
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

    this['ringOptions'] = /** @type {osx.feature.RingOptions} */ (feature.get(RecordField.RING_OPTIONS));

    if (!this.isFeatureDynamic()) {
      var rotation = feature.get(Fields.BEARING);
      if (typeof rotation === 'string' && !isEmptyOrWhitespace(rotation)) {
        rotation = Number(rotation);
      }
      if (rotation == null || isNaN(rotation)) {
        rotation = undefined;
      }
      this['iconRotation'] = rotation;
    }

    if (this['labels'].length == 0) {
      // make sure there is at least one blank label so it shows up in the UI
      this['labels'].push(cloneConfig());
    }
  }

  /**
   * Get a numeric field from a feature, returning undefined if the value is not a number.
   *
   * @param {Feature} feature The feature to update
   * @param {string} field The field to retrieve
   * @param {number=} opt_default The default value
   * @return {number|undefined}
   * @private
   */
  getNumericField_(feature, field, opt_default) {
    var defaultValue = opt_default || undefined;
    var value = Number(feature.get(field));
    return value != null && !isNaN(value) ? value : defaultValue;
  }

  /**
   * Auto detects and applies mappings to the feature.
   * @param {Feature} feature The feature.
   * @protected
   */
  applyMappings(feature) {
    if (feature) {
      const mm = MappingManager.getInstance();
      const mappings = mm.autoDetect([feature]);
      if (mappings && mappings.length) {
        mappings.forEach((m) => {
          m.execute(feature);
        });
      }
    }
  }

  /**
   * Save the feature configuration to a feature.
   *
   * @param {Feature} feature The feature to update
   * @protected
   */
  saveToFeature(feature) {
    if (feature) {
      this.saveGeometry_(feature);

      feature.set(FeatureEditField.NAME, this['name'], true);
      feature.set(FeatureEditField.DESCRIPTION, TuiEditor.render(this['description']), true);
      feature.set(FeatureEditField.MD_DESCRIPTION, this['description'], true);

      switch (this['dateType']) {
        case AnyDateType.NOTIME:
          feature.set(RecordField.TIME, undefined, true);
          break;
        case AnyDateType.INSTANT:
          feature.set(RecordField.TIME, new TimeInstant(this['startTime']), true);
          break;
        case AnyDateType.RANGE:
          feature.set(RecordField.TIME, new TimeRange(this['startTime'], this['endTime']), true);
          break;
        default:
          break;
      }

      var configs;

      // determine where to start with style configs
      if (this.originalProperties_ && this.originalProperties_[StyleType.FEATURE]) {
        // clone the original configs
        configs = /** @type {Object} */ (unsafeClone(this.originalProperties_[StyleType.FEATURE]));
      } else {
        // create a fresh config using a clone of the default vector config
        configs = [unsafeClone(osStyle.DEFAULT_VECTOR_CONFIG)];
      }

      // set the feature style override to the configs
      feature.set(StyleType.FEATURE, configs, true);

      // set the shape to use and apply shape config
      feature.set(StyleField.SHAPE, this['shape'], true);
      feature.set(StyleField.CENTER_SHAPE, this['centerShape'], true);

      // Dynamic features will manage bearing/rotation internally.
      if (!this.isFeatureDynamic()) {
        if (this.showIcon() || this.showCenterIcon()) {
          feature.set(Fields.BEARING,
              typeof this['iconRotation'] === 'number' ? this['iconRotation'] % 360 : undefined,
              true);
          feature.set(StyleField.SHOW_ROTATION, true, true);
          feature.set(StyleField.ROTATION_COLUMN, Fields.BEARING, true);
        } else {
          feature.set(Fields.BEARING, undefined, true);
          feature.set(StyleField.SHOW_ROTATION, false, true);
          feature.set(StyleField.ROTATION_COLUMN, undefined, true);
        }
      }

      Controller.updateFeatureStyle(feature);

      if (Array.isArray(configs)) {
        configs.forEach(function(config) {
          this.setFeatureConfig_(config);
        }, this);
      } else {
        this.setFeatureConfig_(configs);
      }

      // update if the label should be displayed
      if (this['showLabels'] != feature.get(RecordField.FORCE_SHOW_LABEL)) {
        feature.set(RecordField.FORCE_SHOW_LABEL, this['showLabels'], true);
        updateShown();
      }

      Controller.persistFeatureLabels(feature);
      Controller.restoreFeatureLabels(feature);

      osStyle.setFeatureStyle(feature);

      this.updateAltMode(feature);
      this.applyMappings(feature);

      dispatcher.getInstance().dispatchEvent(EventType.SAVE_FEATURE);
    }
  }

  /**
   * @param {Object} config
   * @private
   */
  setFeatureConfig_(config) {
    var opacity = normalizeOpacity(this['opacity']);
    var color = asArray(this['color']);
    color[3] = opacity;
    color = osStyle.toRgbaString(color);

    // set color/size/line dash
    osStyle.setConfigColor(config, color);
    osStyle.setConfigSize(config, this['size']);
    osStyle.setConfigLineDash(config, this['lineDash']);

    // drop opacity to 0 if the shape style is set to 'None'
    if (this['shape'] === osStyle.ShapeType.NONE) {
      osStyle.setConfigOpacityColor(config, 0);
    }

    // set fill color for polygons
    if (this['fillColor'] != null && this['fillOpacity'] != null) {
      var fillColor = asArray(this['fillColor']);
      var fillOpacity = normalizeOpacity(this['fillOpacity']);
      fillColor[3] = fillOpacity;
      fillColor = osStyle.toRgbaString(fillColor);
      osStyle.setFillColor(config, fillColor);
    }

    // set icon config if selected
    var useCenter = this.showCenterIcon();
    if ((this['shape'] === osStyle.ShapeType.ICON || useCenter) && config['image'] != null) {
      config['image']['color'] = color;
      config['image']['scale'] = osStyle.sizeToScale(this['size']);
      osStyle.setConfigIcon(config, useCenter ? this['centerIcon'] : this['icon']);
    }

    // update label fields
    var labelColor = asArray(this['labelColor']);
    labelColor[3] = opacity;
    labelColor = osStyle.toRgbaString(labelColor);

    config[StyleField.LABELS] = this['labels'];
    config[StyleField.LABEL_COLOR] = labelColor;
    config[StyleField.LABEL_SIZE] = parseInt(this['labelSize'], 10) || DEFAULT_SIZE;
  }

  /**
   * Save the geometry to a feature.
   *
   * @param {Feature} feature The feature to update
   * @private
   */
  saveGeometry_(feature) {
    var geom = feature.getGeometry();
    if (this['pointGeometry']) {
      // make sure the coordinate values are numeric
      var lon = Number(this['pointGeometry']['lon']);
      var lat = Number(this['pointGeometry']['lat']);

      var altUnit = this['altUnits'] || Units.METERS;
      var alt = convertUnits(Number(this['altitude']) || 0, Units.METERS, altUnit);

      feature.set(Fields.ALT, alt, true);
      feature.set(Fields.ALT_UNITS, altUnit, true);

      if (!isNaN(lon) && !isNaN(lat)) {
        var coords = transform([lon, lat, alt], EPSG4326, osMap.PROJECTION);
        geom = feature.getGeometry();
        if (!geom || geom === this.originalGeometry) {
          geom = new Point(coords);
        }

        if (geom instanceof SimpleGeometry) {
          geom.setCoordinates(coords);
        }

        feature.setGeometry(geom);

        // update all coordinate fields from the geometry
        osFeature.populateCoordFields(feature, true, undefined, true);

        if (this.isEllipse() && this['semiMajor'] != null && this['semiMinor'] != null && this['orientation'] != null) {
          // set ellipse fields
          feature.set(Fields.SEMI_MAJOR, this['semiMajor']);
          feature.set(Fields.SEMI_MINOR, this['semiMinor']);
          feature.set(Fields.SEMI_MAJOR_UNITS, this['semiMajorUnits']);
          feature.set(Fields.SEMI_MINOR_UNITS, this['semiMinorUnits']);
          feature.set(Fields.ORIENTATION, this['orientation'] % 360);

          // create the ellipse, replacing the existing ellipse if necessary
          osFeature.createEllipse(feature, true);
        } else {
          // clear ellipse fields on the feature, including derived columns from mappings
          feature.set(Fields.SEMI_MAJOR, undefined, true);
          feature.set(Fields.SEMI_MINOR, undefined, true);
          feature.set(Fields.SEMI_MAJOR_UNITS, undefined, true);
          feature.set(Fields.SEMI_MINOR_UNITS, undefined, true);
          feature.set(Fields.ORIENTATION, undefined, true);
          feature.set(RecordField.ELLIPSE, undefined, true);
          feature.set(RecordField.LINE_OF_BEARING, undefined, true);
          feature.set(DEFAULT_SEMI_MAJ_COL_NAME, undefined, true);
          feature.set(DEFAULT_SEMI_MIN_COL_NAME, undefined, true);
        }

        // set the ring options
        feature.set(RecordField.RING_OPTIONS, this['ringOptions']);
        osFeature.createRings(feature, true);

        // Dynamic features will manage bearing/rotation internally.
        if (!this.isFeatureDynamic()) {
          if ((this.showIcon() || this.showCenterIcon()) && this['iconRotation'] != null) {
            feature.set(StyleField.SHOW_ROTATION, true, true);
            feature.set(Fields.BEARING, this['iconRotation'] % 360, true);
            feature.set(StyleField.ROTATION_COLUMN, Fields.BEARING, true);
          } else {
            feature.set(Fields.BEARING, undefined, true);
            feature.set(StyleField.SHOW_ROTATION, false, true);
            feature.set(StyleField.ROTATION_COLUMN, '', true);
          }
        }
      }
    } else if (this.originalGeometry && (!geom || geom === this.originalGeometry)) {
      geom = this.originalGeometry.clone();
      feature.setGeometry(geom);

      const method = /** @type {Method} */ (geom.get(interpolate.METHOD_FIELD));
      interpolate.beginTempInterpolation(undefined, method);
      interpolate.interpolateFeature(feature);
      interpolate.endTempInterpolation();
    }

    this.updateAltMode(feature);
  }

  /**
   * @param {Feature} feature
   * @protected
   */
  updateAltMode(feature) {
    var newAltMode = this['altitudeMode'];

    osFeature.forEachGeometry(feature, (g) => {
      let altMode = g.get(RecordField.ALTITUDE_MODE);
      altMode = Array.isArray(altMode) && altMode.length ? altMode[0] : altMode;

      if (altMode !== newAltMode) {
        Controller.setGeometryRecursive(g, RecordField.ALTITUDE_MODE, newAltMode, true);
        g.changed();
      }
    });
  }

  /**
   * Handles column changes
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onColumnChange(event) {
    event.stopPropagation();
    this.updatePreview();
  }

  /**
   * Handles ring options changes.
   *
   * @param {angular.Scope.Event} event
   * @param {Object<string, *>} options The new ring options.
   * @protected
   */
  onRingsChange(event, options) {
    event.stopPropagation();
    this['ringOptions'] = options;

    this.updatePreview();
  }

  /**
   * Handle changes to the icon color.
   *
   * @param {string=} opt_new The new color value
   * @param {string=} opt_old The old color value
   * @export
   */
  onIconColorChange(opt_new, opt_old) {
    if (opt_new != opt_old) {
      if (this['labelColor'] == opt_old) {
        this['labelColor'] = opt_new;
      }

      if (this['fillColor'] == opt_old) {
        this['fillColor'] = opt_new;
      }
    }

    this.updatePreview();
  }

  /**
   * Handle changes to the line dash style.
   *
   * @param {string=} opt_new The new value
   * @param {string=} opt_old The old value
   * @export
   */
  onLineDashChange(opt_new, opt_old) {
    if (opt_new != opt_old && this['lineDash'] == opt_old) {
      this['lineDash'] = opt_new;
    }

    this.updatePreview();
  }

  /**
   * Handle icon change.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {osx.icon.Icon} value The new value.
   * @export
   */
  onIconChange(event, value) {
    event.stopPropagation();

    this['icon'] = value;
    this['centerIcon'] = value;
    this.updatePreview();
  }

  /**
   * Handles label color reset
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onLabelColorReset(event) {
    event.stopPropagation();

    this['labelColor'] = this['color'];
    this.updatePreview();
  }

  /**
   * Handles when the opacity slider has moved
   * @param {angular.Scope.Event} event The Angular event.
   * @param {number} value The new value.
   * @export
   */
  onOpacityValueChange(event, value) {
    event.stopPropagation();

    this['opacity'] = value;
  }

  /**
   * Handles when the fill opacity is changed
   * @param {angular.Scope.Event} event The Angular event.
   * @param {number} value The new value.
   * @export
   */
  onFillOpacityChange(event, value) {
    event.stopPropagation();

    this['fillOpacity'] = value;
    this.updatePreview();
  }

  /**
   * Handles when the fill color is changed
   * @param {angular.Scope.Event} event The Angular event.
   * @param {string} value
   * @export
   */
  onFillColorChange(event, value) {
    event.stopPropagation();

    this['fillColor'] = value;
    this.updatePreview();
  }

  /**
   * Handles fill color reset
   * @param {angular.Scope.Event} event
   * @export
   */
  onFillColorReset(event) {
    event.stopPropagation();

    this['fillColor'] = this['color'];
    this.updatePreview();
  }

  /**
   * Get the minimum value for the semi-major ellipse axis by converting semi-minor to the semi-major units.
   *
   * @return {number}
   * @export
   */
  getSemiMajorMin() {
    var min = 1e-16;

    if (this['semiMinor'] != null && this['semiMinorUnits'] && this['semiMajorUnits']) {
      min = convertUnits(this['semiMinor'], this['semiMajorUnits'], this['semiMinorUnits']);
    }

    return min;
  }

  /**
   * Handle changes to the semi-major or semi-minor axis. This corrects the initial arrow key/scroll value caused by
   * using "1e-16" as the min value to invalidate the form when 0 is used.
   *
   * @export
   */
  onAxisChange() {
    if (this['semiMinor'] === 1e-16) {
      this['semiMinor'] = 1;
    }

    if (this['semiMajor'] === 1e-16) {
      this['semiMajor'] = 1;
    }

    this.updatePreview();
  }

  /**
   * Enables the modify geometry interaction.
   *
   * @export
   */
  modifyGeometry() {
    if (this.interaction) {
      dispose(this.interaction);
    }

    if (this.previewFeature) {
      const mc = getMapContainer();
      this.interaction = new Modify(this.previewFeature);
      this.interaction.setOverlay(/** @type {VectorLayer} */ (mc.getDrawingLayer()));

      mc.getMap().addInteraction(this.interaction);
      this.interaction.setActive(true);
      this.interaction.showControls();

      listen(this.interaction, ModifyEventType.COMPLETE, this.onInteractionComplete, this);
      listen(this.interaction, ModifyEventType.CANCEL, this.onInteractionCancel, this);
    }
  }

  /**
   * Callback handler for successfully completing a modify of a geometry.
   * @param {PayloadEvent} event
   */
  onInteractionComplete(event) {
    const clone = /** @type {!Feature} */ (event.getPayload());
    const geometry = clone.getGeometry();

    if (geometry) {
      this.originalGeometry = geometry;
      this.previewFeature.setGeometry(geometry);
      this.previewFeature.unset(interpolate.ORIGINAL_GEOM_FIELD, true);
      interpolate.interpolateFeature(this.previewFeature);
    }

    this.updatePreview();

    dispose(this.interaction);
    this.interaction = null;
  }

  /**
   * Callback handler for canceling a modify.
   */
  onInteractionCancel() {
    dispose(this.interaction);
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

  /**
   * @param {Geometry} geom
   * @return {?Geometry}
   */
  static getFirstNonCollectionGeometry_(geom) {
    var type = geom.getType();
    if (type === GeometryType.GEOMETRY_COLLECTION) {
      var geometries = /** @type {GeometryCollection} */ (geom).getGeometriesArray();
      if (geometries.length) {
        geom = Controller.getFirstNonCollectionGeometry_(geometries[0]);
      } else {
        return null;
      }
    }

    return geom;
  }

  /**
   * @param {Geometry} geom
   * @param {string} field
   * @param {*} value
   * @param {boolean=} opt_silent
   */
  static setGeometryRecursive(geom, field, value, opt_silent) {
    var type = geom.getType();
    if (type === GeometryType.GEOMETRY_COLLECTION) {
      var geometries = /** @type {GeometryCollection} */ (geom).getGeometriesArray();
      for (var i = 0, n = geometries.length; i < n; i++) {
        Controller.setGeometryRecursive(geometries[i], field, value, opt_silent);
      }
    } else {
      geom.set(field, value, opt_silent);
    }
  }

  /**
   * Calculates the X pixel position to create the feature edit window at for a given geometry. Tries to keep it out
   * of the way of the view.
   * @param {Geometry|undefined} geom The geometry
   * @return {number} The X coordinate
   */
  static calculateXPosition(geom) {
    var container = angular.element(windowSelector.CONTAINER);
    if (geom) {
      var extent = getFunctionalExtent(geom);
      var center = getCenter(extent);
      var pixel = getMapContainer().getMap().getPixelFromCoordinate(center);
      var width = container.width();
      return pixel[0] > width / 2 ? 50 : container.width() - 650;
    }

    // no geom, open it on the right side
    return container.width() - 650;
  }

  /**
   * Initialize labels on a place.
   *
   * @param {Feature} feature The feature
   */
  static persistFeatureLabels(feature) {
    if (feature) {
      var configs = /** @type {Array|Object|undefined} */ (feature.get(StyleType.FEATURE));
      var config = Array.isArray(configs) ? configs[0] : configs;
      if (config) {
        var labels = config[StyleField.LABELS];
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

        feature.set(StyleField.LABELS, labelNames, true);
        feature.set(StyleField.SHOW_LABEL_COLUMNS, showColumns, true);
        feature.set(StyleField.LABEL_COLOR, config[StyleField.LABEL_COLOR], true);
        feature.set(StyleField.LABEL_SIZE, config[StyleField.LABEL_SIZE], true);
      }
    }
  }

  /**
   * Initialize labels on a feature.
   *
   * @param {Feature} feature The feature
   */
  static restoreFeatureLabels(feature) {
    if (feature) {
      var showLabels = feature.get(RecordField.FORCE_SHOW_LABEL);
      if (typeof showLabels == 'string' || showLabels === true) {
        feature.set(RecordField.FORCE_SHOW_LABEL, showLabels == 'true' || showLabels == '1');
      }

      var configs = /** @type {(Array<Object<string, *>>|Object<string, *>)} */ (
        feature.get(StyleType.FEATURE));

      if (configs) {
        if (Array.isArray(configs)) {
          configs.forEach(function(config) {
            Controller.restoreFeatureConfigLabels(feature, config);
          });
        } else {
          Controller.restoreFeatureConfigLabels(feature, configs);
        }
      }
    }
  }

  /**
   * Initialize labels on a feature config.
   *
   * @param {Feature} feature The feature
   * @param {Object<string, *>} config The config
   */
  static restoreFeatureConfigLabels(feature, config) {
    if (feature && config) {
      var labelNames = feature.get(StyleField.LABELS);
      var showColumns = feature.get(StyleField.SHOW_LABEL_COLUMNS);
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

        config[StyleField.LABELS] = labels;
      }

      var labelColor = feature.get(StyleField.LABEL_COLOR);
      if (labelColor) {
        config[StyleField.LABEL_COLOR] = labelColor;
      }

      var labelSize = feature.get(StyleField.LABEL_SIZE);
      if (labelSize) {
        config[StyleField.LABEL_SIZE] = labelSize;
      }
    }
  }

  /**
   * Updates a feature style if os fields are found on the feature. This allows displaying points and other shapes
   * that aren't supported by KML.
   *
   * @param {Feature} feature The feature to update
   */
  static updateFeatureStyle(feature) {
    if (feature) {
      var configs = /** @type {Array|Object|undefined} */ (feature.get(StyleType.FEATURE));
      var config = Array.isArray(configs) ? configs[0] : configs;
      if (config) {
        var shape = /** @type {string|undefined} */ (feature.get(StyleField.SHAPE));
        if (shape != null) {
          if (osStyle.ELLIPSE_REGEXP.test(shape)) {
            // if an ellipse shape is selected, create the ellipse on the feature
            osFeature.createEllipse(feature, true);
          } else if (config['geometry'] === RecordField.ELLIPSE) {
            // if not, make sure the style isn't configured to render the ellipse geometry
            delete config['geometry'];
          }

          var osShape = osStyle.SHAPES[shape];
          if (osShape && osShape['config']) {
            merge(osShape['config'], config);
          }

          var centerShape = /** @type {string|undefined} */ (feature.get(StyleField.CENTER_SHAPE));
          var hasCenter = osStyle.CENTER_LOOKUP[shape];
          if (centerShape && hasCenter) {
            var centerShapeStyleConfig = osStyle.SHAPES[centerShape];
            if (centerShapeStyleConfig && centerShapeStyleConfig['config']) {
              merge(centerShapeStyleConfig['config'], config);
            }
          }

          // if a shape other than icon is defined, we need to translate the icon config to a vector config
          if (shape != osStyle.ShapeType.ICON) {
            assert(config['image'] != null, 'image config must be defined for icons');
            var image = config['image'];

            // the type wasn't replaced by merging the shape config, so delete it
            if (image['type'] == 'icon') {
              delete image['type'];
            }

            // grab the color/size from the icon configuration
            var color = osStyle.toRgbaString(image['color'] || osStyle.DEFAULT_LAYER_COLOR);
            var size = image['scale'] ? osStyle.scaleToSize(image['scale']) : osStyle.DEFAULT_FEATURE_SIZE;
            var lineDash = config['stroke'] && config['stroke']['lineDash'];
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
            if (shape === osStyle.ShapeType.NONE) {
              osStyle.setConfigOpacityColor(config, 0);
            }
          } else {
            var bearing = /** @type {number} */ (feature.get(Fields.BEARING));
            if (!isNaN(bearing)) {
              config['image']['rotation'] = toRadians(bearing);

              // when setting the icon rotation, ensure the appropriate rotation columns are set on the feature.
              feature.set(StyleField.SHOW_ROTATION, true, true);
              feature.set(StyleField.ROTATION_COLUMN, Fields.BEARING, true);
            }
          }
        }
      }
    }
  }
}

/**
 * Identifier used for a temporary preview feature.
 * @type {string}
 * @const
 */
Controller.TEMP_ID = 'features#temporary';

/**
 * Default label.
 * @type {!LabelConfig}
 */
Controller.DEFAULT_LABEL = {
  'column': FeatureEditField.NAME,
  'showColumn': false
};

/**
 * Fields for a feature in this dialog.
 * @type {!Array<string>}
 * @const
 */
Controller.FIELDS = [
  FeatureEditField.NAME,
  FeatureEditField.DESCRIPTION,
  Fields.BEARING, // for icon
  Fields.LAT,
  Fields.LON,
  Fields.ALT,
  Fields.ALT_UNITS,
  RecordField.ALTITUDE_MODE,
  Fields.LAT_DDM,
  Fields.LON_DDM,
  Fields.LAT_DMS,
  Fields.LON_DMS,
  Fields.MGRS,
  Fields.SEMI_MAJOR,
  Fields.SEMI_MINOR,
  Fields.SEMI_MAJOR_UNITS,
  Fields.SEMI_MINOR_UNITS,
  Fields.ORIENTATION, // for ellipse
  StyleField.SHAPE,
  StyleField.CENTER_SHAPE,
  StyleField.LABELS,
  StyleField.LABEL_COLOR,
  StyleField.LABEL_SIZE
];

/**
 * Style used for hiding geometries such as the line and marker
 */
Controller.HIDE_GEOMETRY = '__hidden__';

/**
 * Launch a window to create or edit a feature.
 *
 * @param {!FeatureEditOptions} options
 */
export const launchFeatureEdit = function(options) {
  var windowId = 'featureEdit';
  if (osWindow.exists(windowId)) {
    osWindow.bringToFront(windowId);
  } else {
    var scopeOptions = {
      'options': options
    };
    var geom = /** @type {SimpleGeometry} */ (options.geometry) ||
        options.feature ? options.feature.getGeometry() : null;
    var x = Controller.calculateXPosition(geom);
    var label = options['label'] ? options['label'] : (options['feature'] ? 'Edit' : 'Add') + ' Feature';
    var icon = options['icon'] ? options['icon'] : 'fa fa-map-marker';
    var windowOptions = {
      'id': windowId,
      'label': label,
      'icon': icon,
      'x': x,
      'y': 'center',
      'width': 600,
      'min-width': 400,
      'max-width': 1000,
      'height': 'auto',
      'modal': false,
      'show-close': true
    };

    var template = `<${directiveTag}></${directiveTag}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
