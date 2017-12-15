goog.provide('os.buffer');

goog.require('ol.Feature');
goog.require('os.command.ParallelCommand');
goog.require('os.geo.jsts');
goog.require('os.ui.buffer.bufferDialogDirective');
goog.require('os.ui.query');
goog.require('os.ui.query.cmd.AreaAdd');


/**
 * @typedef {{
 *   distance: number,
 *   units: string,
 *   outside: boolean,
 *   inside: boolean,
 *   title: string,
 *   description: string,
 *   tags: string,
 *   geometry: (ol.geom.Geometry|undefined),
 *   features: !Array<!ol.Feature>
 * }}
 */
os.buffer.BufferConfig;


/**
 * Icon used for the buffer region feature.
 * @type {string}
 * @const
 */
os.buffer.ICON = 'fa-dot-circle-o';


/**
 * The base settings key to use for buffer region configuration.
 * @type {string}
 * @const
 */
os.buffer.BASE_KEY = 'bufferRegion.';


/**
 * @enum {string}
 */
os.buffer.BufferSetting = {
  DISTANCE: os.buffer.BASE_KEY + 'distance',
  UNITS: os.buffer.BASE_KEY + 'units'
};


/**
 * Style config for buffer previews.
 * @type {Object}
 * @const
 */
os.buffer.PREVIEW_STYLE = {
  'fill': {
    'color': 'rgba(0,255,255,.15)'
  },
  'stroke': {
    'width': os.style.DEFAULT_FEATURE_SIZE,
    'color': 'rgba(0,255,255,1)'
  }
};


/**
 * Default title for buffer areas.
 * @type {string}
 * @const
 */
os.buffer.DEFAULT_TITLE = 'Buffer Region';


/**
 * Limitation on the number of features that can be buffered in live preview mode.
 * @type {number}
 * @const
 */
os.buffer.FEATURE_LIMIT = goog.userAgent.WEBKIT ? 500 : 100;


/**
 * Limitation on the number of source verticies that can be buffered in live preview mode.
 * @type {number}
 * @const
 */
os.buffer.VERTEX_LIMIT = goog.userAgent.WEBKIT ? 5000 : 2000;


/**
 * Create a default configuration object for a buffer region.
 * @return {!os.buffer.BufferConfig}
 */
os.buffer.getBaseConfig = function() {
  return {
    'distance': /** @type {number} */ (os.settings.get(os.buffer.BufferSetting.DISTANCE, 5)),
    'units': /** @type {string} */ (os.settings.get(os.buffer.BufferSetting.UNITS,
        os.math.Units.KILOMETERS)),
    'outside': true,
    'inside': false,
    'title': os.buffer.DEFAULT_TITLE,
    'description': '',
    'tags': '',
    'features': []
  };
};


/**
 * Save a buffer region configuration to settings.
 * @param {!os.buffer.BufferConfig} config
 */
os.buffer.saveConfig = function(config) {
  os.settings.set(os.buffer.BufferSetting.DISTANCE, config['distance']);
  os.settings.set(os.buffer.BufferSetting.UNITS, config['units']);
};


/**
 * Creates buffer regions from a buffer config and adds them to the area manager.
 * @param {os.buffer.BufferConfig} config The buffer config
 * @return {boolean}
 */
os.buffer.isConfigValid = function(config) {
  return config['features'] && config['features'].length > 0 && config['distance'] != null;
};


/**
 * If live preview mode should be allowed in the buffer form.
 * @param {os.buffer.BufferConfig} config The buffer config
 * @return {boolean}
 */
os.buffer.allowLivePreview = function(config) {
  if (config['features']) {
    if (config['features'].length > os.buffer.FEATURE_LIMIT) {
      return false;
    }

    var vertexCount = 0;
    for (var i = 0; i < config['features'].length && vertexCount < os.buffer.VERTEX_LIMIT; i++) {
      var feature = config['features'][i];
      var geometry = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry());
      if (geometry) {
        var stride = geometry.getStride();
        var coordinates = geometry.getFlatCoordinates();
        vertexCount += coordinates.length / stride;
      }
    }

    return vertexCount < os.buffer.VERTEX_LIMIT;
  }

  return true;
};


/**
 * Creates buffer regions from a buffer config and adds them to the area manager.
 * @param {os.buffer.BufferConfig} config The buffer config
 * @param {boolean=} opt_preview If the features should only be returned for preview
 * @return {Array<!ol.Feature>} The new areas
 */
os.buffer.createFromConfig = function(config, opt_preview) {
  if (os.buffer.isConfigValid(config)) {
    var distance = os.math.convertUnits(config['distance'], os.math.Units.METERS, config['units']);
    var areas = [];

    for (var i = 0; i < config['features'].length; i++) {
      var feature = config['features'][i];

      // try to set the title from the config
      var featureTitle = os.buffer.DEFAULT_TITLE;
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
        var geoms = (featGeom.getType() == ol.geom.GeometryType.GEOMETRY_COLLECTION) ?
            /** @type {!ol.geom.GeometryCollection} */ (featGeom).getGeometriesArray() : [featGeom];

        for (var j = 0, n = geoms.length; j < n; j++) {
          var absDistance = Math.abs(distance);
          var buffer;
          var outer;
          var inner;

          if (config['outside'] && config['inside']) {
            outer = os.geo.jsts.buffer(geoms[j], absDistance);
            inner = os.geo.jsts.buffer(geoms[j], -absDistance);

            // if either buffer operation fails, do not create a buffer!
            if (outer && inner) {
              // remove the inner buffer from the outer to create an area surrounding the original geometry
              var result = os.geo.jsts.removeFrom(new ol.Feature(outer), new ol.Feature(inner));
              if (result) {
                buffer = result.getGeometry();
              }
            }
          } else if (config['outside']) {
            buffer = os.geo.jsts.buffer(geoms[j], absDistance);
          } else if (config['inside']) {
            buffer = os.geo.jsts.buffer(geoms[j], -absDistance);
          }

          if (buffer) {
            var area = new ol.Feature(buffer);
            area.setId(i);
            area.set('title', '' + featureTitle);
            area.set('description', config['descColumn'] ? feature.get(config['descColumn']['field']) :
                config['description']);
            area.set('tags', config['tagsColumn'] ? feature.get(config['tagsColumn']['field']) :
                config['tags']);
            area.set(os.data.RecordField.DRAWING_LAYER_NODE, false);

            var source = os.feature.getSource(feature);
            if (source) {
              area.set(os.data.RecordField.SOURCE_NAME, source.getTitle(), true);
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
          var area = new os.ui.query.cmd.AreaAdd(areas[i]);
          cmds.push(area);
        }

        var cmd = new os.command.ParallelCommand();
        cmd.setCommands(cmds);
        cmd.title = 'Add buffer region' + (cmds.length > 1 ? 's' : '');
        os.command.CommandProcessor.getInstance().addCommand(cmd);
      }

      return areas;
    }
  }

  return null;
};


/**
 * Launch a dialog to create buffer regions around features.
 * @param {Object} options
 */
os.buffer.launchDialog = function(options) {
  var windowId = 'Buffer';
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var windowOptions = {
      'id': windowId,
      'label': 'Create Buffer Region' + (options['features'] ? '' : 's'),
      'icon': 'fa ' + os.buffer.ICON,
      'x': 'center',
      'y': 'center',
      'width': '425',
      'min-width': '300',
      'max-width': '800',
      'height': 'auto',
      'show-close': 'true'
    };

    var template = '<bufferdialog></bufferdialog>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, options);
  }
};
