goog.declareModuleId('os.query.BaseAreaManager');

import Feature from 'ol/src/Feature.js';
import GeoJSON from 'ol/src/format/GeoJSON.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import {VectorSourceEvent} from 'ol/src/source/Vector.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import * as osArray from '../array/array.js';
import Settings from '../config/settings.js';
import CollectionManager from '../data/collectionmanager.js';
import RecordField from '../data/recordfield.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {normalizeGeometryCoordinates} from '../geo/geo2.js';
import {toPolygon, validate} from '../geo/jsts.js';
import GeometryField from '../geom/geometryfield.js';
import {ORIGINAL_GEOM_FIELD} from '../interpolate.js';
import * as osMap from '../map/map.js';
import {AREA_STORAGE_KEY} from '../os.js';
import * as osStyleArea from '../style/areastyle.js';
import {directiveTag as editArea} from '../ui/query/editarea.js';
import {EDIT_WIN_LABEL, SAVE_WIN_LABEL} from '../ui/query/query.js';
import {create} from '../ui/window.js';
import {getAreaManager, setAreaManager, getQueryManager} from './queryinstance.js';
import {isWorldQuery} from './queryutils.js';

const {assert} = goog.require('goog.asserts');
const Deferred = goog.require('goog.async.Deferred');
const Delay = goog.require('goog.async.Delay');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: IMapContainer} = goog.requireType('os.map.IMapContainer');


/**
 * Base class for managing areas on the map.
 *
 * @extends {CollectionManager<!Feature>}
 */
export default class BaseAreaManager extends CollectionManager {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Feature|undefined}
     * @protected
     */
    this.highlightFeature = undefined;

    /**
     * @type {goog.log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {IMapContainer}
     * @private
     */
    this.map_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.mapReady_ = false;

    // the check is here for unit tests
    if (this.getMap()) {
      this.getMap().listen('map:ready', this.onMapReady_, false, this);
    }

    /**
     * @type {ol.ProjectionLike}
     * @private
     */
    this.loadProj_ = null;

    /**
     * @type {Delay}
     * @private
     */
    this.saveDelay_ = new Delay(this.save, 100, this);

    this.load();
  }

  /**
   * Handles map ready
   *
   * @private
   */
  onMapReady_() {
    this.mapReady_ = true;

    var areas = this.getAll();
    for (var i = 0, n = areas.length; i < n; i++) {
      var feature = areas[i];
      // we load the areas from settings before the map/projection is ready, so
      // transform it
      feature.getGeometry().osTransform(this.loadProj_);
      var show = /** @type {boolean} */ (feature.get('shown'));
      this.toggle(feature, show !== undefined ? show : true);
    }

    var qm = getQueryManager();
    qm.listen(GoogEventType.PROPERTYCHANGE, this.updateStyles_, false, this);
    this.updateStyles_();
  }

  /**
   * Handles map ready
   *
   * @private
   */
  onMapUnready_() {
    this.mapReady_ = false;
    var qm = getQueryManager();
    qm.unlisten(GoogEventType.PROPERTYCHANGE, this.updateStyles_, false, this);
  }

  /**
   * Gets the map reference relevant to this area manager.
   *
   * @return {IMapContainer}
   */
  getMap() {
    return this.map_;
  }

  /**
   * Sets the map reference relevant to this area manager.
   *
   * @param {IMapContainer} map
   */
  setMap(map) {
    if (this.getMap()) {
      this.getMap().unlisten('map:ready', this.onMapReady_, false, this);
      this.onMapUnready_();
    }

    this.map_ = map;

    if (this.getMap()) {
      this.onMapReady_();
      this.getMap().listen('map:ready', this.onMapReady_, false, this);
    }
  }

  /**
   * @inheritDoc
   */
  getId(item) {
    return '' + item.getId();
  }

  /**
   * Add multiple areas to the model in bulk
   *
   * @param {Array<!Feature>} features
   * @param {boolean=} opt_show
   */
  bulkAdd(features, opt_show) {
    var show = opt_show || false;

    osArray.forEach(features, function(feature) {
      if (!feature.getId()) {
        feature.setId(BaseAreaManager.FEATURE_PREFIX + getRandomString());
      }
      if (!feature.get('temp') && !feature.get('title')) {
        feature.set('temp', true);
        feature.set('title', 'temp area ' + BaseAreaManager.tempId_++);
      }

      feature.set('shown', show);
      this.addInternal(feature, true);
    }, this);

    this.dispatchEvent(new PropertyChangeEvent('areas'));
  }

  /**
   * @inheritDoc
   */
  add(feature) {
    assert(feature !== undefined, 'Cannot add null/undefined feature');

    if (!feature.getId()) {
      feature.setId(BaseAreaManager.FEATURE_PREFIX + getRandomString());
    }

    if (!feature.get('title') && feature.get('name')) {
      // new feature, likely a file import
      feature.set('temp', true);
      feature.set('title', feature.get('name'));
    } else if (!feature.get('temp') && !feature.get('title')) {
      feature.set('temp', true);
      feature.set('title', 'temp area ' + BaseAreaManager.tempId_++);
    }

    var added = this.addInternal(feature);

    // If it didn't get added, it was probably edited. So we'll just dispatch and save on
    // every incoming item.
    this.dispatchEvent(new PropertyChangeEvent('add/edit', feature));
    this.saveDelay_.start();

    return added;
  }

  /**
   * Check if the feature can be used as an area. Returns true if the area is a valid Polygon/MultiPolygon, or if it can
   * be translated into one.
   *
   * @param {!Feature} feature The feature
   * @return {boolean}
   * @protected
   */
  isValidFeature(feature) {
    var geometry = feature.getGeometry();
    var originalGeometry = /** @type {ol.geom.Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD));
    if (!geometry) {
      return false;
    }

    var isValid = false;
    var geomType = geometry.getType();
    if (geomType == GeometryType.POLYGON || geomType == GeometryType.MULTI_POLYGON) {
      var validated = validate(geometry);
      var validatedOriginal = null;

      if (originalGeometry) {
        validatedOriginal = validate(originalGeometry);
      }

      isValid = true;

      feature.setGeometry(validated);
      feature.set(ORIGINAL_GEOM_FIELD, validatedOriginal || validated);
    } else {
      try {
        var polygon = toPolygon(geometry);
        if (polygon) {
          feature.setGeometry(polygon);
          isValid = true;
        }
      } catch (e) {
        log.error(this.log, 'Error converting ' + geomType + ' to polygon:', e);
        isValid = false;
      }
    }

    if (isValid) {
      this.normalizeGeometry(feature);
    }

    return isValid;
  }

  /**
   * @param {Feature} feature
   * @protected
   */
  normalizeGeometry(feature) {
    normalizeGeometryCoordinates(feature.getGeometry());
  }

  /**
   * filter the list of features to only include valid areas
   *
   * @param {Array<Feature>} features
   * @return {Array<ol.Feature>}
   */
  filterFeatures(features) {
    if (features) {
      return features.filter(function(feature) {
        return feature != null && this.isValidFeature(feature);
      }, this);
    }

    return null;
  }

  /**
   * @param {Feature} feature
   * @param {boolean=} opt_bulk - just show/hide on bulk
   * @return {boolean}
   * @protected
   * @override
   */
  addInternal(feature, opt_bulk) {
    var bulk = opt_bulk || false;

    if (feature != null && this.isValidFeature(feature)) {
      feature.unset(RecordField.DRAWING_LAYER_NODE, true);

      if (super.addInternal(feature)) {
        if (this.mapReady_) {
          var show = /** @type {boolean} */ (feature.get('shown'));
          if (bulk) {
            this.showHideFeature(feature, show !== undefined ? show : true);
          } else {
            this.toggle(feature, show !== undefined ? show : true);
          }
        }
        return true;
      }
    } else {
      AlertManager.getInstance().sendAlert('Area is invalid and cannot be used. Common problems include polygons ' +
        'that cross themselves and multipolygons with overlapping elements.',
      AlertEventSeverity.WARNING);
    }

    return false;
  }

  /**
   * Toggles the feature on the map
   *
   * @param {string|Feature} idOrFeature
   * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
   */
  showHideFeature(idOrFeature, opt_toggle) {
    var feature = this.get(idOrFeature);

    if (feature) {
      var show = opt_toggle !== undefined ? opt_toggle : !this.getMap().containsFeature(feature);

      feature.set('shown', show);
      if (show) {
        if (!this.getMap().containsFeature(feature)) {
          // set style
          this.setDefaultStyle(feature);

          // show it
          this.getMap().addFeature(feature);
        }
      } else {
        // remove it
        this.getMap().removeFeature(feature);
      }

      this.saveDelay_.start();
    }
  }

  /**
   * Show or hide all area features
   *
   * @param {boolean} show
   */
  toggleAllFeatures(show) {
    var areas = this.getAll();
    for (var i = 0; i < areas.length; i = i + 1) {
      this.toggle(areas[i], show);
    }
  }

  /**
   * Toggles the feature on the map
   *
   * @param {string|Feature} idOrFeature
   * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
   */
  toggle(idOrFeature, opt_toggle) {
    this.showHideFeature(idOrFeature, opt_toggle);

    var feature = this.get(idOrFeature);
    if (feature) {
      this.dispatchEvent(new PropertyChangeEvent('toggle', feature));
      feature.dispatchEvent('toggle'); // node needs to be notified since toggling doesn't require a search (areas.js)
    }
  }

  /**
   * @inheritDoc
   */
  remove(feature) {
    var val = super.remove(feature);

    if (val && this.getMap()) {
      this.unhighlight(feature);
      this.getMap().removeFeature(val);
      this.saveDelay_.start();
    }

    return val;
  }

  /**
   * Clears all areas in the manager.
   *
   * @return {Array<Feature>} The areas that were removed.
   */
  clear() {
    var qm = getQueryManager();
    var areas = this.getAll();
    var removed = [];

    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      this.remove(area);
      removed.push(area);

      var entries = area.getId() ? qm.getEntries(null, /** @type {string} */ (area.getId())) : [];
      if (entries) {
        qm.removeEntriesArr(entries);
      }
    }

    return removed;
  }

  /**
   * Clears all the temporary areas in the manager.
   *
   * @return {Array<Feature>} The areas that were removed.
   */
  clearTemp() {
    var qm = getQueryManager();
    var areas = this.getAll();
    var removed = [];

    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      if (area.get('temp')) {
        this.remove(area);
        removed.push(area);
      }

      var entries = area.getId() ? qm.getEntries(null, /** @type {string} */ (area.getId())) : [];
      if (entries) {
        qm.removeEntriesArr(entries);
      }
    }

    return removed;
  }

  /**
   * saves the areas
   *
   * @return {!Deferred}
   */
  save() {
    // base area manager doesn't save/load, so fire the callback immediately
    return Deferred.succeed();
  }

  /**
   * loads the areas
   *
   * @return {!Deferred<Array<Feature>>}
   */
  load() {
    this.dispatchEvent(new PropertyChangeEvent('areas'));

    // base area manager doesn't save/load, so fire the callback immediately
    return Deferred.succeed();
  }

  /**
   * Gets areas from storage
   *
   * @return {!Deferred<Array<Feature>>}
   */
  getStoredAreas() {
    return Deferred.succeed(this.onAreasLoaded_(
        /** @type {?Object} */ (Settings.getInstance().get(AREA_STORAGE_KEY))));
  }

  /**
   * Handle areas loaded from storage.
   *
   * @param {Object} obj
   * @return {Array<!Feature>}
   * @private
   */
  onAreasLoaded_(obj) {
    if (obj && obj['features']) {
      var format = new GeoJSON();
      this.loadProj_ = osMap.PROJECTION;

      var areas = /** @type {Array<!Feature>} */ (format.readFeatures(obj, {
        featureProjection: this.loadProj_
      }));

      // normalize all areas loaded from storage - they should have been normalized by the application already
      if (areas) {
        for (var i = 0; i < areas.length; i++) {
          var geom = areas[i] ? areas[i].getGeometry() : undefined;
          if (geom) {
            geom.set(GeometryField.NORMALIZED, true, true);
          }
        }
      }

      return areas;
    }

    return null;
  }

  /**
   * Sets the default style on a feature.
   *
   * @param {Feature} feature
   * @protected
   */
  setDefaultStyle(feature) {
    feature.setStyle(osStyleArea.DEFAULT_STYLE);
  }

  /**
   * Updates styles based on queries in query manager
   *
   * @private
   */
  updateStyles_() {
    var areas = this.getAll();
    var changed = false;

    for (var i = 0, n = areas.length; i < n; i++) {
      if (this.updateStyle(areas[i], true)) {
        changed = true;
      }
    }

    if (changed) {
      // 2D just needs one redraw at the end
      var source = /** @type {OLVectorSource} */ (this.getMap().getLayer(BaseAreaManager.DRAW_ID).getSource());
      source.changed();
    }
  }

  /**
   * @param {!Feature} area
   * @param {boolean=} opt_suppress
   * @return {boolean} true if changed
   * @protected
   */
  updateStyle(area, opt_suppress) {
    var qm = getQueryManager();

    var changed = false;
    var defaultStyle = osStyleArea.DEFAULT_STYLE;
    var includeStyle = osStyleArea.INCLUSION_STYLE;
    var excludeStyle = osStyleArea.EXCLUSION_STYLE;
    var entries = qm.getEntries(null, /** @type {string} */ (area.getId()));

    var expectedStyle = defaultStyle;
    var source = /** @type {OLVectorSource} */ (this.getMap().getLayer(BaseAreaManager.DRAW_ID).getSource());

    if (entries && entries.length > 0) {
      var layerSet = getQueryManager().getLayerSet();
      var layers = Object.keys(layerSet);
      var layer = layers.length == 1 ? layers[0] : null;
      if (layer) {
        for (var i = 0, n = entries.length; i < n; i++) {
          if (entries[i]['layerId'] == layer) {
            expectedStyle = entries[i]['includeArea'] ? includeStyle : excludeStyle;
            break;
          }
        }
      } else {
        expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ? includeStyle : excludeStyle;
      }
    }

    var style = area.getStyle();

    var id = area.getId();
    if (style !== expectedStyle && id) {
      area.setStyle(expectedStyle);

      if (source.getFeatureById(id)) {
        // 3D can take per feature updates
        source.dispatchEvent(new VectorSourceEvent(VectorEventType.CHANGEFEATURE, area));
        changed = true;
      }
    }

    if (changed && !opt_suppress) {
      // 2D just needs one redraw at the end
      source.changed();
    }

    return changed;
  }

  /**
   * Dispatch a change event
   *
   * @param {!Feature} area
   */
  redraw(area) {
    var source = /** @type {OLVectorSource} */ (this.getMap().getLayer(BaseAreaManager.DRAW_ID).getSource());
    var id = area.getId();
    if (id && source.getFeatureById(id)) {
      source.dispatchEvent(new VectorSourceEvent(VectorEventType.CHANGEFEATURE, area));
    }
    source.changed();
  }

  /**
   * @param {string|Feature} idOrFeature
   */
  unhighlight(idOrFeature) {
    if (this.highlightFeature) {
      this.getMap().removeFeature(this.highlightFeature);
      this.highlightFeature = undefined;
    }
  }

  /**
   * @param {string|Feature} idOrFeature
   */
  highlight(idOrFeature) {
    if (this.highlightFeature) {
      this.getMap().removeFeature(this.highlightFeature);
      this.highlightFeature = undefined;
    }

    var area = this.get(idOrFeature);

    if (area && this.getMap().containsFeature(area)) {
      var geometry = area.getGeometry();
      if (geometry) {
        var feature = new Feature(geometry.clone());
        // do not show a drawing layer node for this feature
        feature.set(RecordField.DRAWING_LAYER_NODE, false);
        const highStyle = osStyleArea.HIGHLIGHT_STYLE;
        const fill = highStyle.fill;
        if (this.getMap().is3DEnabled() && isWorldQuery(feature.getGeometry())) {
          highStyle.fill = null;
        }
        this.highlightFeature = this.getMap().addFeature(feature, highStyle);
        highStyle.fill = fill;
      }
    }
  }

  /**
   * Notify listeners that a state for this feature has changed
   *
   * @param {Feature} feature The feature
   * @param {string} evt The name of the event
   */
  fireStateChangeEvent(feature, evt) {
    if (feature) {
      this.dispatchEvent(new PropertyChangeEvent(evt, feature.getId()));
    }
  }

  /**
   * @param {!Feature} area
   * @return {boolean}
   */
  static filterTemp(area) {
    return /** @type {boolean} */ (!area.get('temp'));
  }

  /**
   * @param {!Feature} feature The feature to save as an area
   * @param {Array<ColumnDefinition>=} opt_columns Columns to display in the save area dialog
   */
  static save(feature, opt_columns) {
    var columns = opt_columns || undefined;
    var scopeOptions = {
      'feature': feature,
      'columns': columns
    };

    var winLabel;
    if (!getAreaManager().get(feature) || feature.get('temp')) {
      winLabel = SAVE_WIN_LABEL;
    } else {
      winLabel = EDIT_WIN_LABEL;
    }

    var windowOptions = {
      'label': winLabel,
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 'auto',
      'show-close': true,
      'modal': true
    };

    var template = `<${editArea}></${editArea}>`;
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @param {!Array<!Feature>} features The feature to merge into a new area
   * @param {string=} opt_ui The directive to use
   */
  static merge(features, opt_ui) {
    var scopeOptions = {
      'features': features
    };

    var windowOptions = {
      'label': 'Merge Areas',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 'auto',
      'show-close': true,
      'modal': false
    };

    var ui = opt_ui || 'mergeareas';
    var template = '<' + ui + '></' + ui + '>';
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Get the global instance.
   * @return {!BaseAreaManager}
   */
  static getInstance() {
    // Global instance is managed by the os.query.instance module to avoid circular dependency issues.
    let instance = getAreaManager();
    if (!instance) {
      instance = new BaseAreaManager();
      setAreaManager(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {BaseAreaManager} value The instance.
   */
  static setInstance(value) {
    setAreaManager(value);
  }
}


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.query.BaseAreaManager');


/**
 * Drawing layer ID
 * @type {string}
 */
BaseAreaManager.DRAW_ID = 'draw';


/**
 * Prefix for areas
 * @type {string}
 * @const
 */
BaseAreaManager.FEATURE_PREFIX = 'area_';


/**
 * @type {number}
 * @private
 */
BaseAreaManager.tempId_ = 1;
