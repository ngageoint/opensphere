goog.provide('plugin.vectortools.JoinLayer');

goog.require('os.array');
goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Command for copying a vector layer
 * @constructor
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractSource}
 * @param {!Array<string>} sourceIds The data source ID to join
 * @param {!Array<string>} indexFields The field to use as the join index on each source
 * @param {string} indexerType The type of indexer this command uses
 * @param {string=} opt_name Optional name to give the merged layer
 * @param {plugin.vectortools.Options=} opt_options The feature options
 */
plugin.vectortools.JoinLayer = function(sourceIds, indexFields, indexerType, opt_name, opt_options) {
  goog.asserts.assert(sourceIds && indexFields && sourceIds.length === indexFields.length,
      'Argument error! sourceIds and indexFields must be present and have equal lengths');

  /**
   * @type {Array<string>}
   * @private
   */
  this.sourceIds_ = sourceIds;

  /**
   * @type {Array<string>}
   * @private
   */
  this.indexFields_ = indexFields;

  /**
   * @type {string}
   * @private
   */
  this.indexerType_ = indexerType;

  /**
   * @type {Object<string, function(string):function(Object):(number|string)>}
   * @private
   */
  this.indexers_ = {
    'unique': this.uniqueIndexer_,
    'contains': this.containsIndexer_
  };

  this.options_ = opt_options;

  plugin.vectortools.JoinLayer.base(this, 'constructor', sourceIds[0]);
  this.title = 'Join Layer';

  /**
   * @type {?string}
   * @private
   */
  this.newLayerId_ = null;

  /**
   * @type {string}
   * @private
   */
  this.newLayerName_ = os.layer.getUniqueTitle(opt_name || 'Joined Layer');
};
goog.inherits(plugin.vectortools.JoinLayer, os.command.AbstractSource);


/**
 * @inheritDoc
 */
plugin.vectortools.JoinLayer.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var sources = this.sourceIds_.map(this.mapSources_, this);
    if (sources) {
      var newLayer = plugin.vectortools.addNewLayer(sources[0].getId());
      var newSource = /** @type {os.source.Vector} */ (newLayer.getSource());

      this.newLayerId_ = newSource.getId();
      newLayer.setTitle(this.newLayerName_);
      newSource.setTitle(this.newLayerName_);

      var columnAssocs = plugin.vectortools.getColumnMappings(this.sourceIds_);
      newSource.setColumns(plugin.vectortools.getCombinedColumns(sources, columnAssocs));
      var indexers = this.indexFields_.map(this.getIndexer_());
      var cloneFunc = plugin.vectortools.getFeatureCloneFunction(this.newLayerId_);
      var options = this.options_;

      var sets = sources.map(
          /**
           * @param {os.source.Vector} source The source
           * @param {number} i The source index
           * @return {os.array.JoinSet}
           */
          function(source, i) {
            var features = plugin.vectortools.getFeatures(source, options);
            var data = i === 0 ? features.map(cloneFunc) : features;
            return {
              data: data,
              crossProduct: i === 0,
              indexer: indexers[i]
            };
          });

      var features = os.array.join(sets, this.getCopier_(columnAssocs));
      newSource.addFeatures(features);
      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @return {function(string):function(Object):(number|string)}
 * @private
 */
plugin.vectortools.JoinLayer.prototype.getIndexer_ = function() {
  return this.indexers_[this.indexerType_] || this.uniqueIndexer_;
};


/**
 * @param {string} field
 * @return {function(Object, boolean):(number|string)} index function
 * @private
 */
plugin.vectortools.JoinLayer.prototype.uniqueIndexer_ = function(field) {
  /**
   * @param {Object} obj
   * @return {number|string} the index value
   */
  var indexer = function(obj) {
    return /** @type {string|number} */ (/** @type {ol.Feature} */ (obj).get(field));
  };

  return indexer;
};


/**
 * @param {string} field
 * @return {function(Object, boolean):(number|string)} index function
 * @private
 */
plugin.vectortools.JoinLayer.prototype.containsIndexer_ = function(field) {
  this.memoryIndex = [];

  /**
   * @param {Object} obj
   * @param {boolean} crossProduct
   * @this plugin.vectortools.JoinLayer
   * @return {number|string} the index value
   */
  var indexer = function(obj, crossProduct) {
    var val = /** @type {string|number} */ (/** @type {ol.Feature} */ (obj).get(field));
    if (crossProduct && this.memoryIndex.indexOf(val) == -1) {
      this.memoryIndex.push(val);
    } else if (val) {
      for (var i = 0, ii = this.memoryIndex.length; i < ii; i++) {
        var mem = this.memoryIndex[i];
        if (mem && mem.indexOf(val) != -1 || val.indexOf(mem) != -1) {
          return mem;
        }
      }
    }

    return val;
  };

  return indexer.bind(this);
};


/**
 * @param {?Object<string, Object<string, string>>} columnAssocs Columns to transform by sourceId
 * @return {function(Object, Object):Object} the copy function for the join operation
 * @private
 * @suppress {accessControls}
 */
plugin.vectortools.JoinLayer.prototype.getCopier_ = function(columnAssocs) {
  /**
   * @param {Object} from Object to copy from
   * @param {Object} to Object to copy to
   * @return {Object} resulting object
   */
  var copy = function(from, to) {
    var featureFrom = /** @type {ol.Feature} */ (from);
    var featureTo = /** @type {ol.Feature} */ (to);

    // non-destructive copy
    var fromValues = featureFrom.values_;
    var toValues = featureTo.values_;
    for (var key in fromValues) {
      if (toValues[key] === undefined) {
        toValues[key] = fromValues[key];
      }
    }

    if (columnAssocs) {
      var sourceFrom = /** @type {string} */ (featureFrom.get(os.data.RecordField.SOURCE_ID));
      var sourceTo = /** @type {string} */ (featureTo.get(os.data.RecordField.SOURCE_ID));

      var assocs = [];
      if (sourceFrom && columnAssocs[sourceFrom]) {
        assocs.push(columnAssocs[sourceFrom]);
      }

      if (sourceTo && columnAssocs[sourceTo]) {
        assocs.push(columnAssocs[sourceTo]);
      }

      for (var i = 0, n = assocs.length; i < n; i++) {
        plugin.vectortools.runColumnMapping(assocs[i], featureTo);
      }
    }

    return featureTo;
  };

  return copy;
};


/**
 * @param {string} id The source id
 * @return {os.source.Vector}
 * @private
 */
plugin.vectortools.JoinLayer.prototype.mapSources_ = function(id) {
  this.sourceId = id;
  return /** @type {os.source.Vector} */ (this.getSource());
};


/**
 * @inheritDoc
 */
plugin.vectortools.JoinLayer.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.newLayerId_) {
    os.MapContainer.getInstance().removeLayer(this.newLayerId_);
  }

  this.state = os.command.State.READY;
  return true;
};
