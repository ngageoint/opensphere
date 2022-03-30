goog.declareModuleId('os.layer.config.AbstractDataSourceLayerConfig');

import VectorRenderType from 'ol/src/layer/VectorTileRenderType.js';

import DataManager from '../../data/datamanager.js';
import FeatureImporter from '../../im/featureimporter.js';
import {isTrustedUri} from '../../net/net.js';
import Request from '../../net/request.js';
import RequestSource from '../../source/requestsource.js';
import VectorLayer from '../vector.js';
import AbstractLayerConfig from './abstractlayerconfig.js';
import {mapFeatureTypeColumn} from './layerconfig.js';

const Uri = goog.require('goog.Uri');
const {removeIf} = goog.require('goog.array');
const {assert} = goog.require('goog.asserts');
const {getLogger} = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: IImporter} = goog.requireType('os.im.IImporter');
const {default: IFeatureType} = goog.requireType('os.ogc.IFeatureType');
const {default: IParser} = goog.requireType('os.parse.IParser');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * @abstract
 * @template T
 */
export default class AbstractDataSourceLayerConfig extends AbstractLayerConfig {
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
    this.animate = false;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

    if (options['animate'] !== undefined) {
      this.animate = options['animate'];
    } else {
      this.animate = false;
    }
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    var source = this.getSource(options);

    if (options['attributions']) {
      source.setAttributions(/** @type {Array<string>} */ (options['attributions']));
    }

    source.setId(this.id);
    source.setRequest(this.getRequest(options));
    source.setImporter(this.getImporter(options));
    source.setTitle(this.title);
    source.setTimeEnabled(this.animate);

    if (this.columns) {
      source.setColumns(this.columns);
    }

    var layer = this.getLayer(source, options);
    this.restore(layer, options);

    if (!('load' in options)) {
      // if the load parameter is left out entirely, default it to true
      options['load'] = true;
    }

    if (options['load']) {
      source.refresh();
    }

    return layer;
  }

  /**
   * Restores the layer from the options
   *
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @protected
   */
  restore(layer, options) {
    if (options) {
      layer.restore(options);
    }
  }

  /**
   * Convert feature type columns to column definitions.
   *
   * @param {VectorLayer} layer The layer.
   * @param {Object<string, *>} options The layer config options.
   * @param {!IFeatureType} featureType The feature type.
   * @protected
   */
  fixFeatureTypeColumns(layer, options, featureType) {
    var columns = featureType.getColumns();
    if (columns) {
      // exclude the geometry column
      var geometryColumn = featureType.getGeometryColumnName();
      if (geometryColumn) {
        removeIf(columns, function(column) {
          return column.name == geometryColumn;
        });
      }

      // if columns are saved on the descriptor, we want to update their types to match that of the feature type since that
      // will have the most recent information. these will be restored when set on the source.
      var descriptor = DataManager.getInstance().getDescriptor(/** @type {string|undefined} */ (options['id']) || '');
      if (descriptor) {
        var descriptorColumns = descriptor.getColumns();
        if (descriptorColumns) {
          // create a map of column types from the feature type columns
          var typeMap = {};
          columns.forEach(function(col) {
            if (col.name) {
              typeMap[col.name] = col.type || 'string';
            }
          });

          descriptorColumns.forEach(function(column) {
            var name = /** @type {string} */ (column['name']);
            if (typeMap[name]) {
              column['type'] = typeMap[name];
            }
          });
        }
      }

      // set the columns on the source
      var columnDefs = columns.map(mapFeatureTypeColumn);
      var source = /** @type {VectorSource} */ (layer.getSource());
      if (source) {
        source.setColumns(columnDefs);
      }
    }
  }

  /**
   * @param {Object<string, *>} options Layer configuration options.
   * @return {!IImporter<T>}
   * @protected
   */
  getImporter(options) {
    var importer = new FeatureImporter(this.getParser(options));
    importer.setTrustHTML(isTrustedUri(/** @type {string|undefined} */ (options['url'])));
    return importer;
  }

  /**
   * @abstract
   * @param {Object<string, *>} options Layer configuration options.
   * @return {IParser<T>}
   * @protected
   */
  getParser(options) {}

  /**
   * @param {OLVectorSource} source The layer source.
   * @param {Object<string, *>} options
   * @return {VectorLayer}
   * @protected
   */
  getLayer(source, options) {
    return new VectorLayer({
      source: source,
      renderMode: /** @type {string} */ (options['renderMode']) || VectorRenderType.VECTOR
    });
  }

  /**
   * @param {Object<string, *>} options Layer configuration options.
   * @return {?Request}
   * @protected
   */
  getRequest(options) {
    assert(this.url != null, 'Data source layer URL cannot be null!');

    var uri = new Uri(this.url);
    if (this.params) {
      uri.setQueryData(this.params);
    }

    var request = this.createRequest(uri);
    request.setMethod(options['usePost'] ? Request.METHOD_POST : Request.METHOD_GET);

    return request;
  }

  /**
   * @param {string|Uri} uri
   * @return {!Request}
   */
  createRequest(uri) {
    return new Request(uri);
  }

  /**
   * @param {Object<string, *>} options Layer configuration options.
   * @return {RequestSource}
   * @protected
   */
  getSource(options) {
    return new RequestSource(undefined);
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = getLogger('os.layer.config.AbstractDataSourceLayerConfig');
