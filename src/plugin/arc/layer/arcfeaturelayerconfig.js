goog.provide('plugin.arc.layer.ArcFeatureLayerConfig');

goog.require('goog.log');
goog.require('os.im.FeatureImporter');
goog.require('os.im.mapping.IMapping');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.net.ParamModifier');
goog.require('os.net.Request');
goog.require('os.query.QueryManager');
goog.require('os.query.TemporalHandler');
goog.require('os.query.TemporalQueryManager');
goog.require('plugin.arc.ArcJSONParser');
goog.require('plugin.arc.query.ArcFilterModifier');
goog.require('plugin.arc.query.ArcQueryHandler');
goog.require('plugin.arc.query.ArcTemporalFormatter');
goog.require('plugin.arc.source.ArcRequestSource');



/**
 * Layer config for creating a new Arc request feature layer.
 *
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.arc.layer.ArcFeatureLayerConfig = function() {
  plugin.arc.layer.ArcFeatureLayerConfig.base(this, 'constructor');
  this.log = plugin.arc.layer.ArcFeatureLayerConfig.LOGGER_;
};
goog.inherits(plugin.arc.layer.ArcFeatureLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * The layer config ID for Arc feature layers.
 * @type {string}
 */
plugin.arc.layer.ArcFeatureLayerConfig.ID = 'arcfeature';


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.arc.layer.ArcFeatureLayerConfig.LOGGER_ = goog.log.getLogger('plugin.arc.layer.ArcFeatureLayerConfig');


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.createLayer = function(options) {
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

  var featureType = /** @type {plugin.arc.ArcFeatureType} */ (options['featureType']);
  if (featureType) {
    this.fixFeatureTypeColumns(layer, options, featureType);
  } else {
    this.loadFeatureType(layer, options);
  }

  var useFilter = options['filter'] != null ? options['filter'] : false;
  var useSpatial = options['spatial'] != null ? options['spatial'] : false;
  var useTemporal = options['temporal'] != null ? options['temporal'] : false;

  if (useFilter || useSpatial || useTemporal) {
    if (useFilter) {
      layer.setFilterLauncher(plugin.arc.launchFilterManager.bind(undefined, layer));
      layer.setFilterColumnsFn(plugin.arc.getFilterColumns.bind(undefined, layer));
    }

    var request = source.getRequest();
    request.addModifier(new plugin.arc.query.ArcFilterModifier());

    var handler = new plugin.arc.query.ArcQueryHandler();
    handler.setSource(source);
    os.ui.queryManager.registerHandler(handler);

    if (useTemporal) {
      var tqModifier = new os.net.ParamModifier('time', 'time', '{time}', '');
      var tqFormatter = new plugin.arc.query.ArcTemporalFormatter();
      var tqHandler = new os.query.TemporalHandler();
      tqHandler.setFormatter(tqFormatter);
      tqHandler.setModifier(tqModifier);
      tqHandler.setSource(source);

      var tqManager = os.query.TemporalQueryManager.getInstance();
      tqManager.registerHandler(source.getId(), tqHandler);
    }
  }

  // wait for the feature type to be available to load the source
  if (featureType && options['load']) {
    source.refresh();
  }

  return layer;
};


/**
 * Load the Arc layer metadata to create a feature type.
 *
 * @param {os.layer.Vector} layer The layer.
 * @param {Object} options The layer options.
 * @protected
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.loadFeatureType = function(layer, options) {
  var url = /** @type {string|undefined} */ (options['url']);
  if (url) {
    // modify the query URL to retrieve layer metadata
    url = url.replace(/\/query$/, '?f=json');

    var request = new os.net.Request(url);
    request.getPromise().then(function(response) {
      var config = /** @type {Object} */ (JSON.parse(response));
      var featureType = plugin.arc.createFeatureType(config);
      if (featureType) {
        options['featureType'] = featureType;
        this.fixFeatureTypeColumns(layer, options, featureType);
      } else {
        goog.log.error(this.log, 'Failed parsing Arc feature type for layer "' + options['title'] + '".');
      }

      // even if the feature type couldn't be parsed, the layer may be usable in a limited state. filter edit will not
      // work, for example.
      if (options['load']) {
        var source = layer.getSource();
        if (source) {
          source.refresh();
        }
      }
    }, function(errors) {
      goog.log.error(this.log, 'Failed loading Arc feature type: ' + errors.join(' '));
    }, this);
  }
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.getSource = function(options) {
  return new plugin.arc.source.ArcRequestSource();
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.getRequest = function(options) {
  var request = plugin.arc.layer.ArcFeatureLayerConfig.superClass_.getRequest.call(this, options);
  var format = this.params.get('outputformat');
  var regex = /json/i;

  if (format && regex.test(format)) {
    request.setHeader('Accept', 'application/json, text/plain, */*');
  }

  return request;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.getParser = function(options) {
  return new plugin.arc.ArcJSONParser();
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.getImporter = function(options) {
  var importer = new os.im.FeatureImporter(this.getParser(options));
  if (options['mappings']) {
    importer.setExecMappings(/** @type {Array<os.im.mapping.IMapping>} */ (options['mappings']));
  }

  // set the mappings that will use autodetection
  importer.selectAutoMappings([
    os.im.mapping.RadiusMapping.ID,
    os.im.mapping.OrientationMapping.ID,
    os.im.mapping.SemiMajorMapping.ID,
    os.im.mapping.SemiMinorMapping .ID]);

  return importer;
};
