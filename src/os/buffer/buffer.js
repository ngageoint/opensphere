goog.module('os.buffer');

const userAgent = goog.require('goog.userAgent');
const Feature = goog.require('ol.Feature');
const GeometryType = goog.require('ol.geom.GeometryType');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ParallelCommand = goog.require('os.command.ParallelCommand');
const Settings = goog.require('os.config.Settings');
const RecordField = goog.require('os.data.RecordField');
const osFeature = goog.require('os.feature');
const osJsts = goog.require('os.geo.jsts');
const math = goog.require('os.math');
const Units = goog.require('os.math.Units');
const osStyle = goog.require('os.style');
const {default: AreaAdd} = goog.require('os.ui.query.cmd.AreaAdd');

const Geometry = goog.requireType('ol.geom.Geometry');
const GeometryCollection = goog.requireType('ol.geom.GeometryCollection');
const SimpleGeometry = goog.requireType('ol.geom.SimpleGeometry');


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
let BufferConfig;

/**
 * Icon used for the buffer region feature.
 * @type {string}
 */
const ICON = 'fa-dot-circle-o';

/**
 * The base settings key to use for buffer region configuration.
 * @type {string}
 */
const BASE_KEY = 'bufferRegion.';

/**
 * @enum {string}
 */
const BufferSetting = {
  DISTANCE: BASE_KEY + 'distance',
  UNITS: BASE_KEY + 'units'
};

/**
 * Style config for buffer previews.
 * @type {Object}
 */
const PREVIEW_STYLE = {
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
const DEFAULT_TITLE = 'Buffer Region';

/**
 * Limitation on the number of features that can be buffered in live preview mode.
 * @type {number}
 */
const FEATURE_LIMIT = userAgent.WEBKIT ? 500 : 100;

/**
 * Limitation on the number of source verticies that can be buffered in live preview mode.
 * @type {number}
 */
const VERTEX_LIMIT = userAgent.WEBKIT ? 5000 : 2000;

/**
 * Create a default configuration object for a buffer region.
 *
 * @return {!BufferConfig}
 */
const getBaseConfig = function() {
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
const saveConfig = function(config) {
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
const isConfigValid = function(config) {
  return config['features'] && config['features'].length > 0 && config['distance'] != null;
};

/**
 * If live preview mode should be allowed in the buffer form.
 *
 * @param {BufferConfig} config The buffer config
 * @return {boolean}
 */
const allowLivePreview = function(config) {
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
const createFromConfig = function(config, opt_preview) {
  return createFromConfig_(config, opt_preview);
};

/**
 * Replace default createFromConfig implementation.
 *
 * @param {!function(BufferConfig, boolean=):Array<!Feature>} f The new implementation
 */
const setCreateFromConfig = function(f) {
  createFromConfig_ = f;
};

exports = {
  ICON,
  BASE_KEY,
  BufferSetting,
  PREVIEW_STYLE,
  DEFAULT_TITLE,
  FEATURE_LIMIT,
  VERTEX_LIMIT,
  getBaseConfig,
  saveConfig,
  isConfigValid,
  allowLivePreview,
  createFromConfig,
  setCreateFromConfig,
  BufferConfig
};
