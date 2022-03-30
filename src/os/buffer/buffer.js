goog.declareModuleId('os.buffer');

import Feature from 'ol/src/Feature.js';
import GeometryType from 'ol/src/geom/GeometryType.js';

import CommandProcessor from '../command/commandprocessor.js';
import ParallelCommand from '../command/parallelcommand.js';
import Settings from '../config/settings.js';
import RecordField from '../data/recordfield.js';
import * as osFeature from '../feature/feature.js';
import * as osJsts from '../geo/jsts.js';
import * as math from '../math/math.js';
import Units from '../math/units.js';
import * as osStyle from '../style/style.js';
import AreaAdd from '../ui/query/cmd/areaaddcmd.js';

const userAgent = goog.require('goog.userAgent');

/**
 * @typedef {{
 *   distance: number,
 *   units: string,
 *   outside: boolean,
 *   inside: boolean,
 *   title: string,
 *   description: string,
 *   tags: string,
 *   geometry: (Geometry|undefined),
 *   features: !Array<!Feature>
 * }}
 */
export let BufferConfig;

/**
 * Icon used for the buffer region feature.
 * @type {string}
 */
export const ICON = 'fa-dot-circle-o';

/**
 * The base settings key to use for buffer region configuration.
 * @type {string}
 */
export const BASE_KEY = 'bufferRegion.';

/**
 * @enum {string}
 */
export const BufferSetting = {
  DISTANCE: BASE_KEY + 'distance',
  UNITS: BASE_KEY + 'units'
};

/**
 * Style config for buffer previews.
 * @type {Object}
 */
export const PREVIEW_STYLE = {
  'fill': {
    'color': 'rgba(0,255,255,.15)'
  },
  'stroke': {
    'width': osStyle.DEFAULT_FEATURE_SIZE,
    'color': 'rgba(0,255,255,1)'
  }
};

/**
 * Default title for buffer areas.
 * @type {string}
 */
export const DEFAULT_TITLE = 'Buffer Region';

/**
 * Limitation on the number of features that can be buffered in live preview mode.
 * @type {number}
 */
export const FEATURE_LIMIT = userAgent.WEBKIT ? 500 : 100;

/**
 * Limitation on the number of source verticies that can be buffered in live preview mode.
 * @type {number}
 */
export const VERTEX_LIMIT = userAgent.WEBKIT ? 5000 : 2000;

/**
 * Create a default configuration object for a buffer region.
 *
 * @return {!BufferConfig}
 */
export const getBaseConfig = function() {
  const settings = Settings.getInstance();
  return {
    'distance': /** @type {number} */ (settings.get(BufferSetting.DISTANCE, 5)),
    'units': /** @type {string} */ (settings.get(BufferSetting.UNITS, Units.KILOMETERS)),
    'outside': true,
    'inside': false,
    'title': DEFAULT_TITLE,
    'description': '',
    'tags': '',
    'features': []
  };
};

/**
 * Save a buffer region configuration to settings.
 *
 * @param {!BufferConfig} config
 */
export const saveConfig = function(config) {
  const settings = Settings.getInstance();
  settings.set(BufferSetting.DISTANCE, config['distance']);
  settings.set(BufferSetting.UNITS, config['units']);
};

/**
 * Creates buffer regions from a buffer config and adds them to the area manager.
 *
 * @param {BufferConfig} config The buffer config
 * @return {boolean}
 */
export const isConfigValid = function(config) {
  return config['features'] && config['features'].length > 0 && config['distance'] != null;
};

/**
 * If live preview mode should be allowed in the buffer form.
 *
 * @param {BufferConfig} config The buffer config
 * @return {boolean}
 */
export const allowLivePreview = function(config) {
  if (config['features']) {
    if (config['features'].length > FEATURE_LIMIT) {
      return false;
    }

    var vertexCount = 0;
    for (var i = 0; i < config['features'].length && vertexCount < VERTEX_LIMIT; i++) {
      var feature = config['features'][i];
      var geometry = /** @type {SimpleGeometry} */ (feature.getGeometry());
      if (geometry) {
        var stride = geometry.getStride();
        var coordinates = geometry.getFlatCoordinates();
        vertexCount += coordinates.length / stride;
      }
    }

    return vertexCount < VERTEX_LIMIT;
  }

  return true;
};

/**
 * Creates buffer regions from a buffer config and adds them to the area manager.
 *
 * @param {BufferConfig} config The buffer config
 * @param {boolean=} opt_preview If the features should only be returned for preview
 * @return {Array<!Feature>} The new areas
 */
let createFromConfig_ = function(config, opt_preview) {
  if (isConfigValid(config)) {
    var distance = math.convertUnits(config['distance'], Units.METERS, config['units']);
    var areas = [];

    for (var i = 0; i < config['features'].length; i++) {
      var feature = config['features'][i];

      // try to set the title from the config
      var featureTitle = DEFAULT_TITLE;
      if (config['titleColumn']) {
        // try the property value first
        featureTitle = feature.get(config['titleColumn']['field']);

        if (!featureTitle) {
          // property missing from the feature, use "No COLUMN" instead
          featureTitle = 'No ' + config['titleColumn']['name'];
        }
      } else if (config['title']) {
        // generic title with a one-up counter
        featureTitle = config['title'];

        if (config['features'].length > 1) {
          // append a counter if there are multiple features sharing the title
          featureTitle += ' ' + (i + 1);
        }
      }

      var featGeom = feature.getGeometry();
      if (featGeom) {
        var geoms = (featGeom.getType() == GeometryType.GEOMETRY_COLLECTION) ?
        /** @type {!GeometryCollection} */ (featGeom).getGeometriesArray() : [featGeom];

        for (var j = 0, n = geoms.length; j < n; j++) {
          var absDistance = Math.abs(distance);
          var buffer;
          var outer;
          var inner;

          if (config['outside'] && config['inside']) {
            outer = osJsts.buffer(geoms[j], absDistance);
            inner = osJsts.buffer(geoms[j], -absDistance);

            // if either buffer operation fails, do not create a buffer!
            if (outer && inner) {
              // remove the inner buffer from the outer to create an area surrounding the original geometry
              var result = osJsts.removeFrom(new Feature(outer), new Feature(inner));
              if (result) {
                buffer = result.getGeometry();
              }
            }
          } else if (config['outside']) {
            buffer = osJsts.buffer(geoms[j], absDistance);
          } else if (config['inside']) {
            buffer = osJsts.buffer(geoms[j], -absDistance);
          }

          if (buffer) {
            var area = new Feature(buffer);
            area.setId(i);
            area.set('title', '' + featureTitle);
            area.set('description', config['descColumn'] ? feature.get(config['descColumn']['field']) :
              config['description']);
            area.set('tags', config['tagsColumn'] ? feature.get(config['tagsColumn']['field']) :
              config['tags']);
            area.set(RecordField.DRAWING_LAYER_NODE, false);

            var source = osFeature.getSource(feature);
            if (source) {
              area.set(RecordField.SOURCE_NAME, source.getTitle(), true);
            }

            areas.push(area);
          }
        }
      }
    }

    if (areas.length > 0) {
      if (!opt_preview) {
        var cmds = [];
        for (var i = 0; i < areas.length; i++) {
          var area = new AreaAdd(areas[i]);
          cmds.push(area);
        }

        var cmd = new ParallelCommand();
        cmd.setCommands(cmds);
        cmd.title = 'Add buffer region' + (cmds.length > 1 ? 's' : '');
        CommandProcessor.getInstance().addCommand(cmd);
      }

      return areas;
    }
  }

  return null;
};

/**
 * Creates buffer regions from a buffer config and adds them to the area manager.
 *
 * @param {BufferConfig} config The buffer config
 * @param {boolean=} opt_preview If the features should only be returned for preview
 * @return {Array<!Feature>} The new areas
 */
export const createFromConfig = function(config, opt_preview) {
  return createFromConfig_(config, opt_preview);
};

/**
 * Replace default createFromConfig implementation.
 *
 * @param {!function(BufferConfig, boolean=):Array<!Feature>} f The new implementation
 */
export const setCreateFromConfig = function(f) {
  createFromConfig_ = f;
};
