goog.provide('plugin.vectortools.MergeLayer');

goog.require('goog.array');
goog.require('os.column.ColumnMappingManager');
goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.data.CollectionManager');
goog.require('os.data.OSDataManager');
goog.require('os.events.LayerConfigEvent');
goog.require('os.layer.Vector');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.style.StyleManager');



/**
 * Command for merging vector layers
 * @constructor
 * @implements {os.command.ICommand}
 * @param {!Array<string>} sourceIds The data source IDs to merge
 * @param {string=} opt_name Optional name to give the merged layer
 * @param {plugin.vectortools.Options=} opt_options The options
 */
plugin.vectortools.MergeLayer = function(sourceIds, opt_name, opt_options) {
  /**
   * @type {!Array<string>}
   * @protected
   */
  this.sourceIds = sourceIds;

  /**
   * @type {!os.command.State}
   */
  this.state = os.command.State.READY;

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
  this.newLayerName_ = os.layer.getUniqueTitle(opt_name || 'Merged Layer');
};


/**
 * The current state of the command
 * @override
 * @type {!os.command.State}
 */
plugin.vectortools.MergeLayer.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
plugin.vectortools.MergeLayer.prototype.isAsync = false;


/**
 * @inheritDoc
 */
plugin.vectortools.MergeLayer.prototype.title = 'Merge layers';


/**
 * @inheritDoc
 */
plugin.vectortools.MergeLayer.prototype.details = null;


/**
 * @return {Array.<os.source.ISource>} The sources
 */
plugin.vectortools.MergeLayer.prototype.getSources = function() {
  // iterate thru all the sourceIds and get each of the sources
  var sources = Array(this.sourceIds.length);
  for (var i = 0; i < this.sourceIds.length; i++) {
    sources[i] = os.osDataManager.getSource(this.sourceIds[i]);
  }
  return sources;
};


/**
 * Checks if the command is ready to execute.
 * @return {boolean}
 */
plugin.vectortools.MergeLayer.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  var sources = this.getSources();
  if (!sources) {
    this.state = os.command.State.ERROR;
    return false;
  }

  return true;
};


/**
 * @inheritDoc
 */
plugin.vectortools.MergeLayer.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var sources = this.getSources();
    if (sources && sources.length > 0) {
      // create a new source
      var mergedLayer = plugin.vectortools.addNewLayer({'timeEnabled': true});
      var mergedSource = /** @type {os.source.Vector} */ (mergedLayer.getSource());

      this.newLayerId_ = mergedSource.getId();

      mergedLayer.setTitle(this.newLayerName_);
      mergedSource.setTitle(this.newLayerName_);

      var columnMappings = plugin.vectortools.getColumnMappings(this.sourceIds);
      mergedSource.setColumns(plugin.vectortools.getCombinedColumns(sources, columnMappings));

      var mergedLayerFeatures = [];
      var contribSrcColName = 'CONTRIBUTING_SOURCE';

      for (var i = 0; i < sources.length; i++) {
        var source = /** @type {os.source.Vector} */ (sources[i]);
        if (source) {
          var features = plugin.vectortools.getFeatures(source, this.options_);
          var layerConfig = null;
          var mapping = columnMappings[source.getId()];

          for (var j = 0; j < features.length; j++) {
            var feature = features[j];
            if (feature) {
              if (!layerConfig) {
                layerConfig = os.style.getLayerConfig(feature, source);
              }
              var copiedFeature = os.feature.copyFeature(feature, layerConfig);
              if (mapping) {
                plugin.vectortools.runColumnMapping(mapping, copiedFeature);
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
      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.vectortools.MergeLayer.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  os.MapContainer.getInstance().removeLayer(this.newLayerId_);
  this.state = os.command.State.READY;
  return true;
};
