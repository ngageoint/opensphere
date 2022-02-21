goog.declareModuleId('plugin.vectortools.JoinLayer');

import * as osArray from '../../os/array/array.js';
import AbstractSource from '../../os/command/abstractsourcecmd.js';
import State from '../../os/command/state.js';
import RecordField from '../../os/data/recordfield.js';
import * as layer from '../../os/layer/layer.js';
import MapContainer from '../../os/mapcontainer.js';
import * as vectortools from './vectortools.js';

const asserts = goog.require('goog.asserts');


/**
 * Command for copying a vector layer
 *
 * @implements {ICommand}
 */
export default class JoinLayer extends AbstractSource {
  /**
   * Constructor.
   * @param {!Array<string>} sourceIds The data source ID to join
   * @param {!Array<string>} indexFields The field to use as the join index on each source
   * @param {string} indexerType The type of indexer this command uses
   * @param {string=} opt_name Optional name to give the merged layer
   * @param {Options=} opt_options The feature options
   */
  constructor(sourceIds, indexFields, indexerType, opt_name, opt_options) {
    asserts.assert(sourceIds && indexFields && sourceIds.length === indexFields.length,
        'Argument error! sourceIds and indexFields must be present and have equal lengths');

    super(sourceIds[0]);
    this.title = 'Join Layer';

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

    var exact = JoinLayer.exactAccessor_;
    var caseInsensitive = JoinLayer.caseInsensitiveAccessor_;

    /**
     * @type {Object<string, function(string):function(Object):(number|string)>}
     * @private
     */
    this.indexers_ = {
      'unique': this.getUniqueIndexer(exact),
      'contains': this.getContainsIndexer(exact),
      'uniqueCaseInsensitive': this.getUniqueIndexer(caseInsensitive),
      'containsCaseInsensitive': this.getContainsIndexer(caseInsensitive)
    };

    this.options_ = opt_options;

    /**
     * @type {?string}
     * @private
     */
    this.newLayerId_ = null;

    /**
     * @type {string}
     * @private
     */
    this.newLayerName_ = layer.getUniqueTitle(opt_name || 'Joined Layer');
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var sources = this.sourceIds_.map(this.mapSources_, this);
      if (sources) {
        var newLayer = vectortools.addNewLayer(sources[0].getId());
        var newSource = /** @type {VectorSource} */ (newLayer.getSource());

        this.newLayerId_ = newSource.getId();
        newLayer.setTitle(this.newLayerName_);
        newSource.setTitle(this.newLayerName_);

        var columnAssocs = vectortools.getColumnMappings(this.sourceIds_);
        newSource.setColumns(vectortools.getCombinedColumns(sources, columnAssocs));
        var indexers = this.indexFields_.map(this.getIndexer_());
        var cloneFunc = vectortools.getFeatureCloneFunction(this.newLayerId_);
        var options = this.options_;

        var sets = sources.map(
            /**
             * @param {VectorSource} source The source
             * @param {number} i The source index
             * @return {osArray.JoinSet}
             */
            function(source, i) {
              var features = vectortools.getFeatures(source, options);
              var data = i === 0 ? features.map(cloneFunc) : features;
              return {
                data: data,
                crossProduct: i === 0,
                indexer: indexers[i]
              };
            });

        var features = osArray.join(sets, this.getCopier_(columnAssocs));
        newSource.addFeatures(features);
        this.state = State.SUCCESS;
        return true;
      }
    }

    return false;
  }

  /**
   * @return {function(string):function(Object):(number|string)}
   * @private
   */
  getIndexer_() {
    return this.indexers_[this.indexerType_];
  }

  /**
   * @param {function(Object, string):(number|string)} accessorFunction
   * @return {function(string):function(Object):(number|string)}
   * @protected
   */
  getUniqueIndexer(accessorFunction) {
    return (
      /**
       * @param {string} field
       * @return {function(Object):(number|string)} index function
       * @private
       */
      function(field) {
        /**
         * @param {Object} obj
         * @return {number|string} the index value
         */
        var indexer = function(obj) {
          return accessorFunction(obj, field);
        };

        return indexer;
      });
  }

  /**
   * @param {function(Object, string):(number|string)} accessorFunction
   * @return {function(string):function(Object, boolean):(number|string)}
   * @protected
   */
  getContainsIndexer(accessorFunction) {
    var memoryIndex = [];

    return (
      /**
       * @param {string} field
       * @return {function(Object, boolean):(number|string)} index function
       * @private
       */
      function(field) {
        /**
         * @param {Object} obj
         * @param {boolean} crossProduct
         * @return {number|string} the index value
         */
        var indexer = function(obj, crossProduct) {
          var val = accessorFunction(obj, field);
          if (crossProduct && memoryIndex.indexOf(val) == -1) {
            memoryIndex.push(val);
          } else if (val) {
            for (var i = 0, ii = memoryIndex.length; i < ii; i++) {
              var mem = memoryIndex[i];
              if (mem && mem.indexOf(val) != -1 || val.indexOf(mem) != -1) {
                return mem;
              }
            }
          }

          return val;
        };

        return indexer;
      });
  }

  /**
   * @param {?Object<string, Object<string, string>>} columnAssocs Columns to transform by sourceId
   * @return {function(Object, Object):Object} the copy function for the join operation
   * @private
   * @suppress {accessControls}
   */
  getCopier_(columnAssocs) {
    /**
     * @param {Object} from Object to copy from
     * @param {Object} to Object to copy to
     * @return {Object} resulting object
     */
    var copy = function(from, to) {
      var featureFrom = /** @type {Feature} */ (from);
      var featureTo = /** @type {Feature} */ (to);

      // non-destructive copy
      var fromValues = featureFrom.values_;
      var toValues = featureTo.values_;
      for (var key in fromValues) {
        if (toValues[key] === undefined) {
          toValues[key] = fromValues[key];
        }
      }

      if (columnAssocs) {
        var sourceFrom = /** @type {string} */ (featureFrom.get(RecordField.SOURCE_ID));
        var sourceTo = /** @type {string} */ (featureTo.get(RecordField.SOURCE_ID));

        var assocs = [];
        if (sourceFrom && columnAssocs[sourceFrom]) {
          assocs.push(columnAssocs[sourceFrom]);
        }

        if (sourceTo && columnAssocs[sourceTo]) {
          assocs.push(columnAssocs[sourceTo]);
        }

        for (var i = 0, n = assocs.length; i < n; i++) {
          vectortools.runColumnMapping(assocs[i], featureTo);
        }
      }

      return featureTo;
    };

    return copy;
  }

  /**
   * @param {string} id The source id
   * @return {VectorSource}
   * @private
   */
  mapSources_(id) {
    this.sourceId = id;
    return /** @type {VectorSource} */ (this.getSource());
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (this.newLayerId_) {
      MapContainer.getInstance().removeLayer(this.newLayerId_);
    }

    this.state = State.READY;
    return true;
  }

  /**
   * @param {Object} obj
   * @param {string} field
   * @return {string|number}
   * @private
   */
  static exactAccessor_(obj, field) {
    return /** @type {string|number} */ (/** @type {Feature} */ (obj).get(field));
  }

  /**
   * @param {Object} obj
   * @param {string} field
   * @return {string|number}
   * @private
   */
  static caseInsensitiveAccessor_(obj, field) {
    var val = /** @type {string|number} */ (/** @type {Feature} */ (obj).get(field));
    return val ? val.toString().toLowerCase() : val;
  }
}
