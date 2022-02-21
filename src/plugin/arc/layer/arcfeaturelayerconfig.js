goog.declareModuleId('plugin.arc.layer.ArcFeatureLayerConfig');

import FeatureImporter from '../../../os/im/featureimporter.js';
import OrientationMapping from '../../../os/im/mapping/orientationmapping.js';
import RadiusMapping from '../../../os/im/mapping/radiusmapping.js';
import SemiMajorMapping from '../../../os/im/mapping/semimajormapping.js';
import SemiMinorMapping from '../../../os/im/mapping/semiminormapping.js';
import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import ParamModifier from '../../../os/net/parammodifier.js';
import Request from '../../../os/net/request.js';
import {getQueryManager} from '../../../os/query/queryinstance.js';
import TemporalHandler from '../../../os/query/temporalhandler.js';
import TemporalQueryManager from '../../../os/query/temporalquerymanager.js';
import * as arc from '../arc.js';
import ArcJSONParser from '../arcjsonparser.js';
import ArcFilterModifier from '../query/arcfiltermodifier.js';
import ArcQueryHandler from '../query/arcqueryhandler.js';
import ArcTemporalFormatter from '../query/arctemporalformatter.js';
import ArcRequestSource from '../source/arcrequestsource.js';

const log = goog.require('goog.log');


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

    const maxRecordCount = /** @type {number|undefined} */ (options['maxRecordCount']);
    if (maxRecordCount != null) {
      source.setMaxRecordCount(maxRecordCount);
    }

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
   * Create a new Arc request source for the layer.
   * @return {!ArcRequestSource}
   * @override
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


export default ArcFeatureLayerConfig;
