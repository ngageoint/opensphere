goog.provide('plugin.ogc.wfs.WFSLayerConfig');

goog.require('goog.async.Deferred');
goog.require('goog.string');
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
 * @type {Array<RegExp>}
 */
plugin.ogc.wfs.WFSLayerConfig.PREFERRED_TYPES = [
  /^application\/json$/,
  /gml\/?3/i,
  /gml\/?2/i
];


/**
 * @enum {number}
 */
plugin.ogc.wfs.WFSLayerConfig.TYPES = {
  GEOJSON: 0,
  GML3: 1,
  GML2: 2
};


/**
 * @param {Object<string, *>} options
 * @return {number} 0 = JSON, 1 = GML3, 2 = GML2
 * @protected
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getBestType = function(options) {
  var formats = /** @type {Array<string>} */ (options['formats']);
  var format = /** @type {string} */ (this.params.get('outputformat'));
  var preferred = plugin.ogc.wfs.WFSLayerConfig.PREFERRED_TYPES;

  // see if the given format is one mutually supported by the layer and this plugin
  if (format && (!formats || formats.includes(format))) {
    for (var i = 0, n = preferred.length; i < n; i++) {
      var regex = preferred[i];
      if (regex.test(format)) {
        return i;
      }
    }
  }

  // otherwise, check the available formats for one we support and set that on the params
  if (formats) {
    for (i = 0, n = preferred.length; i < n; i++) {
      regex = preferred[i];

      for (var j = 0, m = formats.length; j < m; j++) {
        if (regex.test(formats[j])) {
          if (this.params) {
            this.params.set('outputformat', formats[j]);
          }

          return i;
        }
      }
    }
  }

  return 1;
};


/**
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getParser = function(options) {
  var type = this.getBestType(options);

  var parser = null;
  var types = plugin.ogc.wfs.WFSLayerConfig.TYPES;

  if (type === types.GEOJSON) {
    var im = os.ui.im.ImportManager.getInstance();
    parser = im.getParser('geojson');

    if (!parser) {
      parser = new plugin.file.geojson.GeoJSONParser();
    }

    parser.setSourceId(this.id);
  } else {
    parser = new plugin.file.gml.GMLParser();

    if (type === types.GML2) {
      parser.useGML2Format(true);
    }
  }

  return /** @type {!os.parse.IParser.<ol.Feature>} */ (parser);
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
 * CSV sources are not lockable.
 *
 * @inheritDoc
 */
plugin.ogc.wfs.WFSLayerConfig.prototype.getSource = function(options) {
  var source = plugin.ogc.wfs.WFSLayerConfig.base(this, 'getSource', options);
  source.setLockable(this.lockable);
  return source;
};
