goog.provide('os.layer.config.AbstractDataSourceLayerConfig');

goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.Fields');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.RecordField');
goog.require('os.fn');
goog.require('os.geo');
goog.require('os.im.FeatureImporter');
goog.require('os.layer.Vector');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.net');
goog.require('os.net.Request');
goog.require('os.source.Request');
goog.require('os.style');
goog.require('os.ui');
goog.require('os.ui.slick.column');



/**
 * @abstract
 * @extends {os.layer.config.AbstractLayerConfig}
 * @constructor
 * @template T
 */
os.layer.config.AbstractDataSourceLayerConfig = function() {
  os.layer.config.AbstractDataSourceLayerConfig.base(this, 'constructor');
  this.log = os.layer.config.AbstractDataSourceLayerConfig.LOGGER_;

  /**
   * @type {boolean}
   * @protected
   */
  this.animate = false;
};
goog.inherits(os.layer.config.AbstractDataSourceLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.config.AbstractDataSourceLayerConfig.LOGGER_ =
    goog.log.getLogger('os.layer.config.AbstractDataSourceLayerConfig');


/**
 * @inheritDoc
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.initializeConfig = function(options) {
  os.layer.config.AbstractDataSourceLayerConfig.superClass_.initializeConfig.call(this, options);

  if (options['animate'] !== undefined) {
    this.animate = options['animate'];
  } else {
    this.animate = false;
  }
};


/**
 * @inheritDoc
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.createLayer = function(options) {
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
};


/**
 * Restores the layer from the options
 *
 * @param {os.layer.Vector} layer
 * @param {Object<string, *>} options
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.restore = function(layer, options) {
  if (options) {
    layer.restore(options);
  }
};


/**
 * @protected
 * @todo Implement mappings.
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.addMappings = os.fn.noop;


/**
 * Convert feature type columns to column definitions.
 *
 * @param {os.layer.Vector} layer The layer.
 * @param {Object<string, *>} options The layer config options.
 * @param {!os.ogc.IFeatureType} featureType The feature type.
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.fixFeatureTypeColumns = function(layer, options, featureType) {
  var columns = featureType.getColumns();
  if (columns) {
    // exclude the geometry column
    var geometryColumn = featureType.getGeometryColumnName();
    if (geometryColumn) {
      goog.array.removeIf(columns, function(column) {
        return column.name == geometryColumn;
      });
    }

    // if columns are saved on the descriptor, we want to update their types to match that of the feature type since that
    // will have the most recent information. these will be restored when set on the source.
    var descriptor = os.dataManager.getDescriptor(/** @type {string|undefined} */ (options['id']) || '');
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
    var columnDefs = columns.map(os.layer.config.mapFeatureTypeColumn);
    var source = /** @type {os.source.Vector} */ (layer.getSource());
    if (source) {
      source.setColumns(columnDefs);
    }
  }
};


/**
 * @param {Object<string, *>} options Layer configuration options.
 * @return {!os.im.IImporter<T>}
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.getImporter = function(options) {
  var importer = new os.im.FeatureImporter(this.getParser(options));
  importer.setTrustHTML(os.net.isTrustedUri(/** @type {string|undefined} */ (options['url'])));
  return importer;
};


/**
 * @abstract
 * @param {Object<string, *>} options Layer configuration options.
 * @return {os.parse.IParser<T>}
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.getParser = function(options) {};


/**
 * @param {ol.source.Vector} source The layer source.
 * @param {Object<string, *>} options
 * @return {os.layer.Vector}
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.getLayer = function(source, options) {
  return new os.layer.Vector({
    source: source,
    renderMode: /** @type {string} */ (options['renderMode']) || ol.layer.VectorRenderType.VECTOR
  });
};


/**
 * @param {Object<string, *>} options Layer configuration options.
 * @return {?os.net.Request}
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.getRequest = function(options) {
  goog.asserts.assert(this.url != null, 'Data source layer URL cannot be null!');

  var uri = new goog.Uri(this.url);
  if (this.params) {
    uri.setQueryData(this.params);
  }

  var request = this.createRequest(uri);
  request.setMethod(options['usePost'] ? os.net.Request.METHOD_POST : os.net.Request.METHOD_GET);

  return request;
};


/**
 * @param {string|goog.Uri} uri
 * @return {!os.net.Request}
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.createRequest = function(uri) {
  return new os.net.Request(uri);
};


/**
 * @param {Object<string, *>} options Layer configuration options.
 * @return {os.source.Request}
 * @protected
 */
os.layer.config.AbstractDataSourceLayerConfig.prototype.getSource = function(options) {
  return new os.source.Request(undefined);
};


/**
 * Map a feature type column to a column definition.
 *
 * @param {!os.ogc.FeatureTypeColumn} ftColumn The feature type column.
 * @return {!os.data.ColumnDefinition} The column definition.
 */
os.layer.config.mapFeatureTypeColumn = function(ftColumn) {
  var name = ftColumn.name.toUpperCase();

  var columnDef = new os.data.ColumnDefinition();
  columnDef['id'] = name;
  columnDef['name'] = name;
  columnDef['field'] = ftColumn.name;
  columnDef['type'] = ftColumn.type;

  os.ui.slick.column.autoSizeColumn(columnDef);

  return columnDef;
};
