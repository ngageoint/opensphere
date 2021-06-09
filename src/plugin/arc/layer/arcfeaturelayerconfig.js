goog.module('plugin.arc.layer.ArcFeatureLayerConfig');

const log = goog.require('goog.log');
const FeatureImporter = goog.require('os.im.FeatureImporter');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const AbstractDataSourceLayerConfig = goog.require('os.layer.config.AbstractDataSourceLayerConfig');
const ParamModifier = goog.require('os.net.ParamModifier');
const Request = goog.require('os.net.Request');
const TemporalHandler = goog.require('os.query.TemporalHandler');
const TemporalQueryManager = goog.require('os.query.TemporalQueryManager');
const {getQueryManager} = goog.require('os.query.instance');
const ArcJSONParser = goog.require('plugin.arc.ArcJSONParser');
const arc = goog.require('plugin.arc');
const ArcFilterModifier = goog.require('plugin.arc.query.ArcFilterModifier');
const ArcQueryHandler = goog.require('plugin.arc.query.ArcQueryHandler');
const ArcTemporalFormatter = goog.require('plugin.arc.query.ArcTemporalFormatter');
const ArcRequestSource = goog.require('plugin.arc.source.ArcRequestSource');

const IMapping = goog.requireType('os.im.mapping.IMapping');
const VectorLayer = goog.requireType('os.layer.Vector');
const ArcFeatureType = goog.requireType('plugin.arc.ArcFeatureType');


/**
 * Layer config for creating a new Arc request feature layer.
 */
class ArcFeatureLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
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

    var featureType = /** @type {ArcFeatureType} */ (options['featureType']);
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
        layer.setFilterLauncher(arc.launchFilterManager.bind(undefined, layer));
        layer.setFilterColumnsFn(arc.getFilterColumns.bind(undefined, layer));
      }

      var request = source.getRequest();
      request.addModifier(new ArcFilterModifier());

      var handler = new ArcQueryHandler();
      handler.setSource(source);
      getQueryManager().registerHandler(handler);

      if (useTemporal) {
        var tqModifier = new ParamModifier('time', 'time', '{time}', '');
        var tqFormatter = new ArcTemporalFormatter();
        var tqHandler = new TemporalHandler();
        tqHandler.setFormatter(tqFormatter);
        tqHandler.setModifier(tqModifier);
        tqHandler.setSource(source);

        var tqManager = TemporalQueryManager.getInstance();
        tqManager.registerHandler(source.getId(), tqHandler);
      }
    }

    // wait for the feature type to be available to load the source
    if (featureType && options['load']) {
      source.refresh();
    }

    return layer;
  }

  /**
   * Load the Arc layer metadata to create a feature type.
   *
   * @param {VectorLayer} layer The layer.
   * @param {Object} options The layer options.
   * @protected
   */
  loadFeatureType(layer, options) {
    var url = /** @type {string|undefined} */ (options['url']);
    if (url) {
      // modify the query URL to retrieve layer metadata
      url = url.replace(/\/query$/, '?f=json');

      var request = new Request(url);
      request.getPromise().then((response) => {
        var config = /** @type {Object} */ (JSON.parse(response));
        var featureType = arc.createFeatureType(config);
        if (featureType) {
          options['featureType'] = featureType;
          this.fixFeatureTypeColumns(layer, options, featureType);
        } else {
          log.error(this.log, 'Failed parsing Arc feature type for layer "' + options['title'] + '".');
        }

        // even if the feature type couldn't be parsed, the layer may be usable in a limited state. filter edit will not
        // work, for example.
        if (options['load']) {
          var source = layer.getSource();
          if (source) {
            source.refresh();
          }
        }
      }, (errors) => {
        log.error(this.log, 'Failed loading Arc feature type: ' + errors.join(' '));
      });
    }
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    return new ArcRequestSource();
  }

  /**
   * @inheritDoc
   */
  getRequest(options) {
    var request = super.getRequest(options);
    var format = this.params.get('outputformat');
    var regex = /json/i;

    if (format && regex.test(format)) {
      request.setHeader('Accept', 'application/json, text/plain, */*');
    }

    return request;
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    return new ArcJSONParser();
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    var importer = new FeatureImporter(this.getParser(options));
    if (options['mappings']) {
      importer.setExecMappings(/** @type {Array<IMapping>} */ (options['mappings']));
    }

    // set the mappings that will use autodetection
    importer.selectAutoMappings([
      RadiusMapping.ID,
      OrientationMapping.ID,
      SemiMajorMapping.ID,
      SemiMinorMapping .ID]);

    return importer;
  }
}


/**
 * The layer config ID for Arc feature layers.
 * @type {string}
 */
ArcFeatureLayerConfig.ID = 'arcfeature';


/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.arc.layer.ArcFeatureLayerConfig');


exports = ArcFeatureLayerConfig;
