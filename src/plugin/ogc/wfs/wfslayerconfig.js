goog.declareModuleId('plugin.ogc.wfs.WFSLayerConfig');

import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import AltMapping from '../../../os/im/mapping/altmapping.js';
import OrientationMapping from '../../../os/im/mapping/orientationmapping.js';
import RadiusMapping from '../../../os/im/mapping/radiusmapping.js';
import SemiMajorMapping from '../../../os/im/mapping/semimajormapping.js';
import SemiMinorMapping from '../../../os/im/mapping/semiminormapping.js';
import DateTimeMapping from '../../../os/im/mapping/time/datetimemapping.js';
import TimeFormat from '../../../os/im/mapping/timeformat.js';
import TimeType from '../../../os/im/mapping/timetype.js';
import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import VectorLayer from '../../../os/layer/vector.js';
import OGCFilterCleaner from '../../../os/ogc/filter/ogcfiltercleaner.js';
import * as ogc from '../../../os/ogc/ogc.js';
import DescribeFeatureLoader from '../../../os/ogc/wfs/describefeatureloader.js';
import WFSFormatter from '../../../os/ogc/wfs/wfsformatter.js';
import ImportManager from '../../../os/ui/im/importmanager.js';
import GeoJSONParser from '../../file/geojson/geojsonparser.js';
import {Controller as ChooseTimeColumnController} from '../ui/choosetimecolumn.js';
import {directiveTag as ogcLayerNodeUi} from '../ui/ogclayernodeui.js';

const Deferred = goog.require('goog.async.Deferred');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');


/**
 * This is a plain WFS layer config that handles DescribeFeatureType, altitude and time mappings,
 * and outputformat detection for GeoJSON, GML3, or GML2.
 */
export default class WFSLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * @type {boolean}
     * @protected
     */
    this.describeType = true;

    /**
     * @type {IFeatureType}
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
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

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

    if (this.describeType) {
      if (this.featureType) {
        this.onFeatureTypeAvailable(layer, options);
      } else {
        this.loadWFSDescribeFeature(layer, options);
      }
    } else if (options['load']) {
      source = /** @type {ISource} */ (layer.getSource());
      source.refresh();
    }

    return layer;
  }

  /**
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @protected
   */
  loadWFSDescribeFeature(layer, options) {
    if (this.url && this.typename) {
      var loader = new DescribeFeatureLoader();
      loader.setUrl(this.url);
      loader.setTypename(this.typename);
      loader.listenOnce(EventType.COMPLETE, this.onDescribeComplete_.bind(this, layer, options));
      loader.load();
    }
  }

  /**
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @param {GoogEvent} event
   * @private
   */
  onDescribeComplete_(layer, options, event) {
    var loader = /** @type {DescribeFeatureLoader} */ (event.target);
    var featureType = loader.getFeatureType();
    if (featureType) {
      this.featureType = featureType;
      this.onFeatureTypeAvailable(layer, options);
    } else {
      var msg = 'Failed loading DescribeFeatureType for ' + this.typename + '. Feature layer will not be loaded.';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    }
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

    request.setValidator(ogc.getException);

    if (options['postFormat'] !== 'kvp') {
      var formatter = new WFSFormatter();
      if (options['contentType']) {
        formatter.contentType = /** @type {string} */ (options['contentType']);
      }

      request.setDataFormatter(formatter);
    }

    const type = this.getBestType(options);
    if (type && type.responseType != null) {
      request.setResponseType(/** @type {ResponseType} */ (type.responseType));
    }

    return request;
  }

  /**
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @protected
   */
  onFeatureTypeAvailable(layer, options) {
    this.featureTypeAvailable(layer, options);
  }

  /**
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @protected
   */
  featureTypeAvailable(layer, options) {
    var source = /** @type {RequestSource} */ (layer.getSource());

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
          request.addModifier(new OGCFilterCleaner());
        }
      }
    };

    if (this.featureType) {
      var deferred = new Deferred();
      deferred.addCallback(setupRequest, this);
      deferred.addCallback(checkRefresh);

      // If theres no start or end date picked. launch the gui
      if (options['temporal'] && this.featureType.getTimeColumns().length >= 2 &&
          (!this.featureType.getStartDateColumnName() || !this.featureType.getEndDateColumnName())) {
        ChooseTimeColumnController.launch(this.id, deferred);
      } else {
        deferred.callback();
      }
    } else {
      checkRefresh();
    }
  }

  /**
   * Adds mappings
   *
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @protected
   */
  addMappings(layer, options) {
    var animate = options['animate'] != null ? options['animate'] : false;
    var source = /** @type {RequestSource} */ (layer.getSource());
    var importer = /** @type {Importer} */ (source.getImporter());
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
        var mapping = new DateTimeMapping(TimeType.START);
        mapping.field = startField;
        mapping.setFormat(TimeFormat.ISO);

        execMappings.push(mapping);

        mapping = new DateTimeMapping(TimeType.END);
        mapping.field = endField;
        mapping.setFormat(TimeFormat.ISO);

        execMappings.push(mapping);
      } else {
        // add a datetime mapping
        // this mapping removes the original field since we're replacing the original with our own
        mapping = new DateTimeMapping(TimeType.INSTANT);
        mapping.field = startField;
        mapping.setFormat(TimeFormat.ISO);

        execMappings.push(mapping);
      }
    }

    // do the other autodetections
    var columnObj = {};
    columns.forEach(function(column) {
      columnObj[column['name']] = column['type'];
    });

    var autodetects = [
      new AltMapping(),
      new RadiusMapping(),
      new OrientationMapping(),
      new SemiMajorMapping(),
      new SemiMinorMapping()
    ];

    const hasEllipse = options['mappings'] ? options['mappings'].some((temp) => this.isEllipticalMapping(temp)) : false;

    for (var i = 0, ii = autodetects.length; i < ii; i++) {
      var mapping = autodetects[i];
      var detected = mapping.autoDetect([columnObj]);

      const isEllipse = detected ? this.isEllipticalMapping(detected) : false;

      if (detected && (!isEllipse && !hasEllipse)) {
        execMappings.push(detected);
      }
    }

    if (execMappings && execMappings.length > 0) {
      importer.setExecMappings(execMappings);
    }

    if (options['mappings']) {
      importer.setUserMappings(/** @type {Array<IMapping>} */ (options['mappings']));
    }
  }


  /**
   * Returns if a mapping is elliptical
   * @param {IMapping} mapping
   * @return {boolean}
   */
  isEllipticalMapping(mapping) {
    const id = mapping.getId();
    return id == RadiusMapping.ID ||
      id == SemiMajorMapping.ID || id == SemiMinorMapping.ID || id == OrientationMapping.ID;
  }

  /**
   * @param {Object<string, *>} options
   * @return {Object} The type config to use.
   * @protected
   */
  getBestType(options) {
    var formats = /** @type {Array<string>|undefined} */ (options['formats']);
    var format = /** @type {string} */ (this.params.get('outputformat'));
    var preferred = WFSLayerConfig.TYPE_CONFIGS;

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
    return WFSLayerConfig.GML3_CONFIG;
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    var typeConfig = this.getBestType(options);
    var im = ImportManager.getInstance();
    var type = typeConfig.type;
    var parser = im.getParser(typeConfig.parser, options);

    // special case handling
    if (type === 'geojson') {
      // geojson needs a reference to the source for style merging purposes
      if (!parser) {
        parser = new GeoJSONParser();
      }

      /** @type {GeoJSONParser} */ (parser).setSourceId(this.id);
    } else if (type == 'gml2') {
      // tell the parser to use it
      /** @type {GMLParser} */ (parser).useGML2Format(true);
    }

    return /** @type {!IParser<Feature>} */ (parser);
  }

  /**
   * @inheritDoc
   */
  getLayer(source, options) {
    var layer = new VectorLayer({
      source: source
    });

    // set up the node ui when the layer node is hovered/selected
    layer.setNodeUI(`<${ogcLayerNodeUi}></${ogcLayerNodeUi}>`);
    return layer;
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    var source = super.getSource(options);
    source.setLockable(this.lockable);
    return source;
  }

  /**
   * Register a type config object.
   * @param {!WFSTypeConfig} config
   * @protected
   */
  static registerType(config) {
    const configs = WFSLayerConfig.TYPE_CONFIGS;

    if (!configs.find((c) => c.type === config.type)) {
      configs.push(config);
    }

    // sort them by priority, highest first
    configs.sort((a, b) => b.priority - a.priority);
  }
}


/**
 * @type {Logger}
 */
const logger = log.getLogger('plugin.ogc.wfs.WFSLayerConfig');


/**
 * Type config for GeoJSON parsing.
 * @type {WFSTypeConfig}
 */
WFSLayerConfig.GEOJSON_CONFIG = {
  regex: /^application\/json$/,
  parser: 'geojson',
  type: 'geojson',
  priority: 100
};


/**
 * Type config for GML3 parsing.
 * @type {WFSTypeConfig}
 */
WFSLayerConfig.GML3_CONFIG = {
  regex: /gml\/?3/i,
  parser: 'gml',
  type: 'gml3',
  priority: 50
};


/**
 * Type config for GML2 parsing.
 * @type {WFSTypeConfig}
 */
WFSLayerConfig.GML2_CONFIG = {
  regex: /gml\/?2/i,
  parser: 'gml',
  type: 'gml2',
  priority: -100
};


/**
 * The available WFS type config objects. Plugins can add supported parser types to this.
 * @type {Array<WFSTypeConfig>}
 */
WFSLayerConfig.TYPE_CONFIGS = [
  WFSLayerConfig.GEOJSON_CONFIG,
  WFSLayerConfig.GML3_CONFIG,
  WFSLayerConfig.GML2_CONFIG
];
