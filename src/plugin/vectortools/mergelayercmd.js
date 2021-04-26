goog.module('plugin.vectortools.MergeLayer');
goog.module.declareLegacyNamespace();

const os = goog.require('os');
const MapContainer = goog.require('os.MapContainer');
const osFeature = goog.require('os.feature');
const layer = goog.require('os.layer');
const vectortools = goog.require('plugin.vectortools');

const State = goog.require('os.command.State');
const style = goog.require('os.style');
const ICommand = goog.requireType('os.command.ICommand');
const VectorSource = goog.requireType('os.source.Vector');


/**
 * Command for merging vector layers
 *
 * @implements {ICommand}
 */
class MergeLayer {
  /**
   * Constructor.
   * @param {!Array<string>} sourceIds The data source IDs to merge
   * @param {string=} opt_name Optional name to give the merged layer
   * @param {plugin.vectortools.Options=} opt_options The options
   */
  constructor(sourceIds, opt_name, opt_options) {
    /**
     * @type {!Array<string>}
     * @protected
     */
    this.sourceIds = sourceIds;

    /**
     * @type {!State}
     */
    this.state = State.READY;

    this.title = 'Merge Layers';
    this.options_ = opt_options;

    /**
     * @type {string}
     * @private
     */
    this.newLayerId_ = '';

    /**
     * @type {string}
     * @private
     */
    this.newLayerName_ = layer.getUniqueTitle(opt_name || 'Merged Layer');
  }

  /**
   * @return {Array.<os.source.ISource>} The sources
   */
  getSources() {
    // iterate thru all the sourceIds and get each of the sources
    var sources = Array(this.sourceIds.length);
    for (var i = 0; i < this.sourceIds.length; i++) {
      sources[i] = os.osDataManager.getSource(this.sourceIds[i]);
    }
    return sources;
  }

  /**
   * Checks if the command is ready to execute.
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    var sources = this.getSources();
    if (!sources) {
      this.state = State.ERROR;
      return false;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var sources = this.getSources();
      if (sources && sources.length > 0) {
        // create a new source
        var mergedLayer = vectortools.addNewLayer({'timeEnabled': true});
        var mergedSource = /** @type {VectorSource} */ (mergedLayer.getSource());

        this.newLayerId_ = mergedSource.getId();

        mergedLayer.setTitle(this.newLayerName_);
        mergedSource.setTitle(this.newLayerName_);

        // for merged layers we want to allow layer level styling
        var options = mergedLayer.getLayerOptions();
        if (!options) {
          options = {};
        }
        options[layer.LayerOption.SHOW_FORCE_COLOR] = true;
        mergedLayer.setLayerOptions(options);

        var columnMappings = vectortools.getColumnMappings(this.sourceIds);
        mergedSource.setColumns(vectortools.getCombinedColumns(sources, columnMappings));

        var mergedLayerFeatures = [];
        var contribSrcColName = 'CONTRIBUTING_SOURCE';

        for (var i = 0; i < sources.length; i++) {
          var source = /** @type {VectorSource} */ (sources[i]);
          if (source) {
            var features = vectortools.getFeatures(source, this.options_);
            var layerConfig = null;
            var mapping = columnMappings[source.getId()];

            for (var j = 0; j < features.length; j++) {
              var feature = features[j];
              if (feature) {
                if (!layerConfig) {
                  layerConfig = style.getLayerConfig(feature, source);
                }
                var copiedFeature = osFeature.copyFeature(feature, layerConfig);
                if (mapping) {
                  vectortools.runColumnMapping(mapping, copiedFeature);
                }
                if (!copiedFeature.get(contribSrcColName)) {
                  copiedFeature.set(contribSrcColName, source.getTitle(true), true); // THIN-8644 contributing source
                }

                mergedLayerFeatures.push(copiedFeature);
              }
            }
          }
        }

        mergedSource.addColumn(contribSrcColName);
        mergedSource.addFeatures(mergedLayerFeatures);
        this.state = State.SUCCESS;
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    MapContainer.getInstance().removeLayer(this.newLayerId_);
    this.state = State.READY;
    return true;
  }
}

/**
 * The current state of the command
 * @override
 * @type {!State}
 */
MergeLayer.prototype.state = State.READY;


/**
 * @inheritDoc
 */
MergeLayer.prototype.isAsync = false;


/**
 * @inheritDoc
 */
MergeLayer.prototype.title = 'Merge layers';


/**
 * @inheritDoc
 */
MergeLayer.prototype.details = null;


exports = MergeLayer;
