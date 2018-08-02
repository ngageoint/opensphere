goog.provide('plugin.arc.layer.ArcFeatureLayerConfig');
goog.require('os.im.FeatureImporter');
goog.require('os.im.mapping.IMapping');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.net.ParamModifier');
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
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.arc.layer.ArcFeatureLayerConfig = function() {
  plugin.arc.layer.ArcFeatureLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.arc.layer.ArcFeatureLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * The layer config ID for Arc feature layers.
 * @type {string}
 */
plugin.arc.layer.ArcFeatureLayerConfig.ID = 'arcfeature';


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcFeatureLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);
  source.setId(this.id);
  source.setRequest(this.getRequest(options));
  source.setImporter(this.getImporter(options));
  source.setTimeEnabled(goog.isDef(this.animate) ? this.animate : false);
  source.setTitle(this.title);

  var layer = this.getLayer(source, options);
  if (options) {
    layer.restore(options);
  }

  var featureType = /** @type {plugin.arc.ArcFeatureType} */ (options['featureType']);
  if (featureType) {
    this.fixFeatureTypeColumns(layer, options, featureType);
  }

  var useFilter = goog.isDefAndNotNull(options['filter']) ? options['filter'] : false;
  var useSpatial = goog.isDefAndNotNull(options['spatial']) ? options['spatial'] : false;
  var useTemporal = goog.isDefAndNotNull(options['temporal']) ? options['temporal'] : false;

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

  if (options['load']) {
    source.refresh();
  }

  return layer;
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
  importer.selectAutoMappings([os.im.mapping.RadiusMapping.ID, os.im.mapping.SemiMajorMapping.ID,
    os.im.mapping.SemiMinorMapping .ID]);

  return importer;
};
