goog.provide('plugin.ogc.wfs.WFSLayerConfig');

goog.require('goog.async.Deferred');
goog.require('goog.string');
goog.require('os.command.VectorLayerPreset');
goog.require('os.im.mapping.AltMapping');
goog.require('os.im.mapping.OrientationMapping');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.SemiMinorMapping');
goog.require('os.im.mapping.TimeFormat');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.layer.Vector');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.layer.preset.LayerPresetManager');
goog.require('os.ogc');
goog.require('os.ogc.filter.OGCFilterCleaner');
goog.require('os.ogc.wfs.DescribeFeatureLoader');
goog.require('os.ogc.wfs.WFSFormatter');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.geojson.GeoJSONParser');
goog.require('plugin.file.gml.GMLParser');
goog.require('plugin.ogc.ui.chooseTimeColumnDirective');
goog.require('plugin.ogc.ui.ogcLayerNodeUIDirective');



/**
 * This is a plain WFS layer config that handles DescribeFeatureType, altitude and time mappings,
 * and outputformat detection for GeoJSON, GML3, or GML2.
 *
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.ogc.wfs.WFSLayerConfig = function() {
  plugin.ogc.wfs.WFSLayerConfig.base(this, 'constructor');
  this.log = plugin.ogc.wfs.WFSLayerConfig.LOGGER_;

  /**
   * @type {boolean}
   * @protected
   */
  this.describeType = true;

  /**
   * @type {os.ogc.IFeatureType}
   */
  this.featureType = null;

  /**
   * @type {?string}
   * @protected
   */
  this.typename = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.lockable = true;
};
goog.inherits(plugin.ogc.wfs.WFSLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.ogc.wfs.WFSLayerConfig.LOGGER_ = goog.log.getLogger('plugin.ogc.wfs.WFSLayerConfig');


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.initializeConfig = function(options) {
  plugin.ogc.wfs.WFSLayerConfig.base(this, 'initializeConfig', options);

  if (options['describeType'] !== undefined) {
    this.describeType = options['describeType'];
  }

  if (options['featureType'] !== undefined) {
    this.featureType = options['featureType'];
  }

  if (this.params) {
    if (this.params.get('typename')) {
      this.typename = /** @type {string} */ (this.params.get('typename'));
    }

    // this will set the outputformat in the params if it isn't already set
    this.getBestType(options);
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);
  source.setId(this.id);
  source.setRequest(this.getRequest(options));
  source.setImporter(this.getImporter(options));
  source.setTimeEnabled(this.animate !== undefined ? this.animate : false);
  source.setTitle(this.title);

  var layer = this.getLayer(source, options);
  if (options) {
    layer.restore(options);
  }

  if (this.describeType) {
    if (this.featureType) {
      this.onFeatureTypeAvailable(layer, options);
    } else {
      this.loadWFSDescribeFeature(layer, options);
    }
  } else if (options['load']) {
    source = /** @type {os.source.ISource} */ (layer.getSource());
    source.refresh();
  }

  return layer;
};


/**
 * @param {os.layer.Vector} layer
 * @param {Object.<string, *>} options
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.loadWFSDescribeFeature = function(layer, options) {
  if (this.url && this.typename) {
    var loader = new os.ogc.wfs.DescribeFeatureLoader();
    loader.setUrl(this.url);
    loader.setTypename(this.typename);
    loader.listenOnce(goog.net.EventType.COMPLETE, this.onDescribeComplete_.bind(this, layer, options));
    loader.load();
  }
};


/**
 * @param {os.layer.Vector} layer
 * @param {Object.<string, *>} options
 * @param {goog.events.Event} event
 * @private
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.onDescribeComplete_ = function(layer, options, event) {
  var loader = /** @type {os.ogc.wfs.DescribeFeatureLoader} */ (event.target);
  var featureType = loader.getFeatureType();
  if (featureType) {
    this.featureType = featureType;
    this.onFeatureTypeAvailable(layer, options);
  } else {
    var msg = 'Failed loading DescribeFeatureType for ' + this.typename + '. Feature layer will not be loaded.';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getRequest = function(options) {
  var request = plugin.ogc.wfs.WFSLayerConfig.superClass_.getRequest.call(this, options);

  var format = this.params.get('outputformat');
  var regex = /json/i;

  if (format && regex.test(format)) {
    request.setHeader('Accept', 'application/json, text/plain, */*');
  }

  request.setValidator(os.ogc.getException);

  if (options['postFormat'] !== 'kvp') {
    request.setDataFormatter(new os.ogc.wfs.WFSFormatter());
  }

  const type = this.getBestType(options);
  if (type && type.responseType != null) {
    request.setResponseType(/** @type {goog.net.XhrIo.ResponseType} */ (type.responseType));
  }

  return request;
};


/**
 * @param {os.layer.Vector} layer
 * @param {Object.<string, *>} options
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.onFeatureTypeAvailable = function(layer, options) {
  this.featureTypeAvailable(layer, options);
};


/**
 * @param {os.layer.Vector} layer
 * @param {Object.<string, *>} options
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.featureTypeAvailable = function(layer, options) {
  var source = /** @type {os.source.Request} */ (layer.getSource());

  var checkRefresh = function() {
    if (source && !source.isDisposed() && options['load']) {
      source.refresh();
    }
  };

  var setupRequest = function() {
    if (source && !source.isDisposed()) {
      var featureType = options['featureType'] = this.featureType;
      if (featureType) {
        this.fixFeatureTypeColumns(layer, options, featureType);
      }

      this.addMappings(layer, options);

      var request = source.getRequest();

      if (request) {
        request.addModifier(new os.ogc.filter.OGCFilterCleaner());
      }
    }
  };

  if (this.featureType) {
    var deferred = new goog.async.Deferred();
    deferred.addCallback(setupRequest, this);
    deferred.addCallback(checkRefresh);

    // If theres no start or end date picked. launch the gui
    if (options['temporal'] && this.featureType.getTimeColumns().length >= 2 &&
        (!this.featureType.getStartDateColumnName() || !this.featureType.getEndDateColumnName())) {
      plugin.ogc.ui.ChooseTimeColumnCtrl.launch(this.id, deferred);
    } else {
      deferred.callback();
    }
  } else {
    checkRefresh();
  }
};


/**
 * Adds mappings
 *
 * @param {os.layer.Vector} layer
 * @param {Object.<string, *>} options
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.addMappings = function(layer, options) {
  var animate = options['animate'] != null ? options['animate'] : false;
  var source = /** @type {os.source.Request} */ (layer.getSource());
  var importer = /** @type {os.im.Importer} */ (source.getImporter());
  var execMappings = [];
  var timeFields = options['timeFields'];

  if (timeFields) {
    if (!Array.isArray(timeFields)) {
      timeFields = [timeFields];
    }

    this.featureType.setStartDateColumnName(timeFields[0]);
    this.featureType.setEndDateColumnName(timeFields[1] || timeFields[0]);
  }

  var startField = this.featureType.getStartDateColumnName();
  var endField = this.featureType.getEndDateColumnName();
  var columns = this.featureType.getColumns();

  // do time autodetection
  if (animate && startField) {
    if (startField === 'validTime' && this.url.indexOf('/ogc/wfsServer') > -1) {
      // validTime means that the feature type is dynamic, which means we need to find the actual start/end fields
      // for the purposes of our mappings
      for (var i = 0, ii = columns.length; i < ii; i++) {
        var col = columns[i];
        if (col['name'] === 'DATE_TIME') {
          // if a DATE_TIME field is defined, then that's the field we need to use
          startField = 'DATE_TIME';
          endField = 'DATE_TIME';
          break;
        }

        if (col['name'] === 'UP_DATE_TIME' || col['name'] === 'DOWN_DATE_TIME') {
          // if UP_DATE_TIME or DOWN_TIME_TIME is defined, then those are the fields we need to use
          startField = 'UP_DATE_TIME';
          endField = 'DOWN_DATE_TIME';
          break;
        }
      }
    }

    if (startField != endField) {
      // add a start/end datetime mapping
      // this mapping does not remove the original fields since it's mapping two fields to one, and the original
      // fields may be wanted when exporting data
      var mapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.START);
      mapping.field = startField;
      mapping.setFormat(os.im.mapping.TimeFormat.ISO);

      execMappings.push(mapping);

      mapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END);
      mapping.field = endField;
      mapping.setFormat(os.im.mapping.TimeFormat.ISO);

      execMappings.push(mapping);
    } else {
      // add a datetime mapping
      // this mapping removes the original field since we're replacing the original with our own
      mapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.INSTANT);
      mapping.field = startField;
      mapping.setFormat(os.im.mapping.TimeFormat.ISO);

      execMappings.push(mapping);
    }
  }

  // do the other autodetections
  var columnObj = {};
  columns.forEach(function(column) {
    columnObj[column['name']] = column['type'];
  });

  var autodetects = [
    new os.im.mapping.AltMapping(),
    new os.im.mapping.RadiusMapping(),
    new os.im.mapping.OrientationMapping(),
    new os.im.mapping.SemiMajorMapping(),
    new os.im.mapping.SemiMinorMapping()
  ];

  for (var i = 0, ii = autodetects.length; i < ii; i++) {
    var mapping = autodetects[i];
    var detected = mapping.autoDetect([columnObj]);

    if (detected) {
      execMappings.push(detected);
    }
  }

  if (execMappings && execMappings.length > 0) {
    importer.setExecMappings(execMappings);
  }
};


/**
 * @param {Object<string, *>} options
 * @return {Object} The type config to use.
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getBestType = function(options) {
  var formats = /** @type {Array<string>|undefined} */ (options['formats']);
  var format = /** @type {string} */ (this.params.get('outputformat'));
  var preferred = plugin.ogc.wfs.WFSLayerConfig.TYPE_CONFIGS;

  // see if the given format is one mutually supported by the layer and this plugin
  if (format && (!formats || formats.includes(format))) {
    for (var i = 0, n = preferred.length; i < n; i++) {
      var pref = preferred[i];
      if (pref.regex.test(format)) {
        return pref;
      }
    }
  }

  // otherwise, check the available formats for one we support and set that on the params
  if (formats) {
    for (var i = 0, n = preferred.length; i < n; i++) {
      var pref = preferred[i];

      for (var j = 0, m = formats.length; j < m; j++) {
        if (pref.regex.test(formats[j])) {
          if (this.params) {
            this.params.set('outputformat', formats[j]);
          }

          return pref;
        }
      }
    }
  }

  this.params.remove('outputformat');
  return plugin.ogc.wfs.WFSLayerConfig.GML3_CONFIG;
};


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getParser = function(options) {
  var typeConfig = this.getBestType(options);
  var im = os.ui.im.ImportManager.getInstance();
  var type = typeConfig.type;
  var parser = im.getParser(typeConfig.parser, options);

  // special case handling
  if (type === 'geojson') {
    // geojson needs a reference to the source for style merging purposes
    if (!parser) {
      parser = new plugin.file.geojson.GeoJSONParser();
    }

    parser.setSourceId(this.id);
  } else if (type == 'gml2') {
    // tell the parser to use it
    /** @type {plugin.file.gml.GMLParser} */ (parser).useGML2Format(true);
  }

  return /** @type {!os.parse.IParser<ol.Feature>} */ (parser);
};


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getLayer = function(source, options) {
  var layer = new os.layer.Vector({
    source: source
  });

  // set up the node ui when the layer node is hovered/selected
  layer.setNodeUI('<ogclayernodeui></ogclayernodeui>');
  return layer;
};


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getSource = function(options) {
  var source = plugin.ogc.wfs.WFSLayerConfig.base(this, 'getSource', options);
  source.setLockable(this.lockable);
  return source;
};


/**
 * Type config for GeoJSON parsing.
 * @type {os.ogc.WFSTypeConfig}
 */
plugin.ogc.wfs.WFSLayerConfig.GEOJSON_CONFIG = {
  regex: /^application\/json$/,
  parser: 'geojson',
  type: 'geojson',
  priority: 100
};


/**
 * Type config for GML3 parsing.
 * @type {os.ogc.WFSTypeConfig}
 */
plugin.ogc.wfs.WFSLayerConfig.GML3_CONFIG = {
  regex: /gml\/?3/i,
  parser: 'gml',
  type: 'gml3',
  priority: 50
};


/**
 * Type config for GML2 parsing.
 * @type {os.ogc.WFSTypeConfig}
 */
plugin.ogc.wfs.WFSLayerConfig.GML2_CONFIG = {
  regex: /gml\/?2/i,
  parser: 'gml',
  type: 'gml2',
  priority: -100
};


/**
 * The available WFS type config objects. Plugins can add supported parser types to this.
 * @type {Array<os.ogc.WFSTypeConfig>}
 */
plugin.ogc.wfs.WFSLayerConfig.TYPE_CONFIGS = [
  plugin.ogc.wfs.WFSLayerConfig.GEOJSON_CONFIG,
  plugin.ogc.wfs.WFSLayerConfig.GML3_CONFIG,
  plugin.ogc.wfs.WFSLayerConfig.GML2_CONFIG
];


/**
 * Register a type config object.
 * @param {!os.ogc.WFSTypeConfig} config
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.registerType = function(config) {
  const configs = plugin.ogc.wfs.WFSLayerConfig.TYPE_CONFIGS;

  if (!configs.find((c) => c.type === config.type)) {
    configs.push(config);
  }

  // sort them by priority, highest first
  configs.sort((a, b) => b.priority - a.priority);
};
