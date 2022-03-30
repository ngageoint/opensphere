goog.declareModuleId('os.query.AreaManager');

import {asString} from 'ol/src/color.js';
import GeoJSON from 'ol/src/format/GeoJSON.js';
import Polygon from 'ol/src/geom/Polygon.js';
import {VectorSourceEvent} from 'ol/src/source/Vector.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';

import '../mixin/objectmixin.js';
import {toRgbArray} from '../color.js';
import TransformAreas from '../command/transformareascmd.js';
import Settings from '../config/settings.js';
import {isRectangular} from '../geo/geo.js';
import {normalizeGeometryCoordinates} from '../geo/geo2.js';
import GeometryField from '../geom/geometryfield.js';
import {METHOD_FIELD, ORIGINAL_GEOM_FIELD, getMethod} from '../interpolate.js';
import Method from '../interpolatemethod.js';
import DrawingLayer from '../layer/drawinglayer.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {AREA_STORAGE_KEY, ALL_AREA_STORAGE_KEY} from '../os.js';
import CommandListEvent from '../proj/commandlistevent.js';
import SwitchProjection from '../proj/switchprojection.js';
import {setFeatureStyle} from '../style/style.js';
import StyleType from '../style/styletype.js';
import BaseAreaManager from './baseareamanager.js';
import {getQueryManager} from './queryinstance.js';
import {isWorldQuery} from './queryutils.js';

const Deferred = goog.require('goog.async.Deferred');
const {unsafeClone} = goog.require('goog.object');

const {default: SettingChangeEvent} = goog.requireType('os.events.SettingChangeEvent');


/**
 * Manages spatial areas
 */
export default class AreaManager extends BaseAreaManager {
  /**
   * Constructor.
   */
  constructor() {
    super();

    AreaManager.FULL_INCLUSION_STYLE.stroke.color =
        Settings.getInstance().get(AreaManager.KEYS.IN_COLOR, AreaManager.DEFAULT.IN_COLOR);
    AreaManager.FULL_INCLUSION_STYLE.stroke.width =
        parseInt(Settings.getInstance().get(AreaManager.KEYS.IN_WIDTH, AreaManager.DEFAULT.IN_WIDTH), 10);
    AreaManager.FULL_EXCLUSION_STYLE.stroke.color =
        Settings.getInstance().get(AreaManager.KEYS.EX_COLOR, AreaManager.DEFAULT.EX_COLOR);
    AreaManager.FULL_EXCLUSION_STYLE.stroke.width =
        parseInt(Settings.getInstance().get(AreaManager.KEYS.EX_WIDTH, AreaManager.DEFAULT.EX_WIDTH), 10);

    Settings.getInstance().listen(AreaManager.KEYS.IN_COLOR, this.updateInColor_, false, this);
    Settings.getInstance().listen(AreaManager.KEYS.IN_WIDTH, this.updateInWidth_, false, this);
    Settings.getInstance().listen(AreaManager.KEYS.EX_COLOR, this.updateExColor_, false, this);
    Settings.getInstance().listen(AreaManager.KEYS.EX_WIDTH, this.updateExWidth_, false, this);

    // when switching projections, we want to transform the areas we're keeping
    SwitchProjection.getInstance().listen(
        CommandListEvent.TYPE, this.onSwitchProjection, false, this);
  }

  /**
   * @inheritDoc
   */
  getMap() {
    return getMapContainer();
  }

  /**
   * @inheritDoc
   */
  load() {
    return this.getStoredAreas().addCallback(function(areas) {
      if (areas) {
        this.bulkAdd(areas, false);
      }
    }, this);
  }

  /**
   * @inheritDoc
   */
  save() {
    var format = new GeoJSON();
    var areasAll = this.getAll();
    var areas = areasAll.filter(BaseAreaManager.filterTemp).map(AreaManager.mapOriginalGeoms);
    var obj = format.writeFeaturesObject(areas, {
      featureProjection: osMap.PROJECTION
    });

    Settings.getInstance().set(AREA_STORAGE_KEY, obj);
    Settings.getInstance().delete(ALL_AREA_STORAGE_KEY);
    return Deferred.succeed();
  }

  /**
   * @inheritDoc
   */
  setDefaultStyle(feature) {
    feature.set(StyleType.HIGHLIGHT, undefined, true);
    feature.set(StyleType.FEATURE, AreaManager.DEFAULT_AREA_STYLE, true);
    setFeatureStyle(feature);
  }

  /**
   * @inheritDoc
   */
  updateStyle(area, opt_suppress) {
    var qm = getQueryManager();

    var changed = false;
    var defaultStyle = undefined;
    var includeStyle = AreaManager.FULL_INCLUSION_STYLE;
    var excludeStyle = AreaManager.FULL_EXCLUSION_STYLE;
    var entries = qm.getEntries(null, /** @type {string} */ (area.getId()));

    var expectedStyle = defaultStyle;
    var source = /** @type {OLVectorSource} */ (getMapContainer().getLayer(
        DrawingLayer.ID).getSource());

    if (entries && entries.length > 0) {
      // todo: loop over entries and determine if area is a full or partial include
      expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ? includeStyle : excludeStyle;
    }

    var style = area.get(StyleType.SELECT);

    var id = area.getId();
    if (style !== expectedStyle && id) {
      area.set(StyleType.SELECT, expectedStyle);
      setFeatureStyle(area);

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
   * @inheritDoc
   */
  redraw(area) {
    var source = /** @type {OLVectorSource} */ (getMapContainer().getLayer(
        DrawingLayer.ID).getSource());
    var id = area.getId();
    if (id && source.getFeatureById(id)) {
      source.dispatchEvent(new VectorSourceEvent(VectorEventType.CHANGEFEATURE, area));
    }
    source.changed();
  }

  /**
   * @inheritDoc
   */
  addInternal(feature, opt_bulk) {
    if (feature && !feature.get(METHOD_FIELD)) {
      var geometry = /** @type {ol.geom.Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD)) ||
          feature.getGeometry();
      var set = false;

      if (geometry instanceof Polygon) {
        var coords = geometry.getCoordinates();

        if (coords.length == 1 && isRectangular(coords[0], geometry.getExtent())) {
          // a single rectangular polygon is a box, which should always be interpolated with rhumb lines
          feature.set(METHOD_FIELD, Method.RHUMB, true);
          set = true;
        }
      }

      if (!set) {
        // if it wasn't a rectangle geometry, then instead fall back to the application setting
        feature.set(METHOD_FIELD, getMethod(), true);
      }

      if (isWorldQuery(geometry)) {
        feature.set(METHOD_FIELD, Method.NONE);
      }
    }

    if (super.addInternal(feature, opt_bulk)) {
      feature.enableEvents();
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  normalizeGeometry(feature) {
    // TODO: I'd prefer to have the normalizeGeometryCoordinate method take an optional projection
    // rather than converting to/from EPSG:4326
    var geom = feature.getGeometry();

    if (!geom.get(GeometryField.NORMALIZED)) {
      normalizeGeometryCoordinates(geom);
      feature.setGeometry(geom);
    }
  }

  /**
   * Converts all color types to a standard rgba string.
   *
   * @param {ol.Color|string} color
   * @return {string}
   */
  toRgbaString(color) {
    return asString(typeof color === 'string' ? toRgbArray(color) : color);
  }

  /**
   * Handle Include Color changes.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  updateInColor_(event) {
    if (event.newVal && this.toRgbaString(/** @type {string} */(event.newVal)) !=
        AreaManager.FULL_INCLUSION_STYLE.stroke.color) {
      AreaManager.FULL_INCLUSION_STYLE.stroke.color = this.toRgbaString(/** @type {string} */(event.newVal));
      this.redrawQueryAreas_();
    }
  }

  /**
   * Handle Include Width changes.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  updateInWidth_(event) {
    if (event.newVal && event.newVal != AreaManager.FULL_INCLUSION_STYLE.stroke.width) {
      AreaManager.FULL_INCLUSION_STYLE.stroke.width = parseInt(event.newVal, 10);
      this.redrawQueryAreas_();
    }
  }

  /**
   * Handle Exclude Color changes.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  updateExColor_(event) {
    if (event.newVal && this.toRgbaString(/** @type {string} */(event.newVal)) !=
        AreaManager.FULL_EXCLUSION_STYLE.stroke.color) {
      AreaManager.FULL_EXCLUSION_STYLE.stroke.color = this.toRgbaString(/** @type {string} */(event.newVal));
      this.redrawQueryAreas_();
    }
  }

  /**
   * Handle Exclude Width changes.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  updateExWidth_(event) {
    if (event.newVal && event.newVal != AreaManager.FULL_EXCLUSION_STYLE.stroke.width) {
      AreaManager.FULL_EXCLUSION_STYLE.stroke.width = parseInt(event.newVal, 10);
      this.redrawQueryAreas_();
    }
  }

  /**
   * Converts all color types to a standard rgba string.
   *
   * @private
   */
  redrawQueryAreas_() {
    var areas = this.getAll();
    areas.forEach(function(area) {
      if (area.getStyle() != null) {
        var entries = getQueryManager().getEntries(null, /** @type {string} */ (area.getId()));
        if (entries && entries.length > 0) {
          var expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ?
            unsafeClone(AreaManager.FULL_INCLUSION_STYLE) :
            unsafeClone(AreaManager.FULL_EXCLUSION_STYLE);
          area.set(StyleType.SELECT, expectedStyle);
          setFeatureStyle(area);
          this.redraw(area);
        }
      }
    }, this);
  }

  /**
   * When SwitchProjection sets up its list of commands, add one to transform our areas.
   *
   * @param {CommandListEvent} evt
   * @protected
   */
  onSwitchProjection(evt) {
    var sp = SwitchProjection.getInstance();
    var oldProjection = sp.getOldProjection();
    var newProjection = sp.getNewProjection();

    if (oldProjection && newProjection) {
      evt.commands.push(new TransformAreas(oldProjection, newProjection));
    }
  }

  /**
   * @param {!Feature} area The area
   * @return {!ol.Feature} The area with the original geometry, if any
   */
  static mapOriginalGeoms(area) {
    var orig = /** @type {ol.geom.Geometry} */ (area.get(ORIGINAL_GEOM_FIELD));

    if (orig) {
      area = /** @type {!Feature} */ (area.clone());
      area.setGeometry(orig);
      area.set(ORIGINAL_GEOM_FIELD, undefined);
    }

    return area;
  }

  /**
   * Get the global instance.
   * @return {!BaseAreaManager}
   * @override
   */
  static getInstance() {
    if (!instance) {
      instance = new AreaManager();
      BaseAreaManager.setInstance(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {BaseAreaManager} value The instance.
   * @override
   */
  static setInstance(value) {
    instance = value;
    BaseAreaManager.setInstance(value);
  }
}

/**
 * Global instance.
 * @type {BaseAreaManager|undefined}
 */
let instance;


/**
 * The base key used by all display settings.
 * @type {string}
 * @const
 */
AreaManager.BASE_KEY = 'os.area.';


/**
 * Area settings keys.
 * @enum {string}
 */
AreaManager.KEYS = {
  IN_COLOR: AreaManager.BASE_KEY + 'inColor',
  IN_WIDTH: AreaManager.BASE_KEY + 'inWidth',
  EX_COLOR: AreaManager.BASE_KEY + 'exColor',
  EX_WIDTH: AreaManager.BASE_KEY + 'exWidth'
};


/**
 * Area settings keys.
 * @enum {string}
 */
AreaManager.DEFAULT = {
  IN_COLOR: 'rgba(255,255,0,1)',
  IN_WIDTH: '2',
  EX_COLOR: 'rgba(255,0,0,1)',
  EX_WIDTH: '2'
};


/**
 * @type {Object}
 * @const
 */
AreaManager.DEFAULT_AREA_STYLE = {
  'stroke': {
    'color': 'rgba(136,136,136,1)',
    'lineCap': 'square',
    'width': 2
  }
};


/**
 * @type {Object}
 * @const
 */
AreaManager.FULL_INCLUSION_STYLE = {
  'stroke': {
    'color': 'rgba(255,255,0,1)',
    'lineCap': 'square',
    'width': 2
  }
};


/**
 * @type {Object}
 * @const
 */
AreaManager.FULL_EXCLUSION_STYLE = {
  'stroke': {
    'color': 'rgba(255,0,0,1)',
    'lineCap': 'square',
    'width': 2
  }
};
