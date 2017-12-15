goog.provide('plugin.ogc.wfs.QueryWFSLayerConfig');

goog.require('os.net.ParamModifier');
goog.require('os.ogc.filter.OGCFilterModifier');
goog.require('os.query.TemporalHandler');
goog.require('os.query.TemporalQueryManager');
goog.require('os.ui.CombinatorCtrl');
goog.require('os.ui.query.ui.CombinatorCtrl');
goog.require('plugin.ogc.query.FilterIDModifier');
goog.require('plugin.ogc.query.OGCQueryHandler');
goog.require('plugin.ogc.query.OGCTemporalFormatter');
goog.require('plugin.ogc.wfs.WFSLayerConfig');



/**
 * The query version of the WFS layer config, which adds connections to various query managers
 * to automatically requery when combinations of areas, filters, and layers change.
 *
 * @extends {plugin.ogc.wfs.WFSLayerConfig}
 * @constructor
 */
plugin.ogc.wfs.QueryWFSLayerConfig = function() {
  plugin.ogc.wfs.QueryWFSLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.ogc.wfs.QueryWFSLayerConfig, plugin.ogc.wfs.WFSLayerConfig);


/**
 * @inheritDoc
 */
plugin.ogc.wfs.QueryWFSLayerConfig.prototype.addMappings = function(layer, options) {
  plugin.ogc.wfs.QueryWFSLayerConfig.base(this, 'addMappings', layer, options);

  var source = /** @type {os.source.Request} */ (layer.getSource());
  var useExclusions = goog.isDefAndNotNull(options['exclusions']) ? options['exclusions'] : false;
  var useFilter = goog.isDefAndNotNull(options['filter']) ? options['filter'] : false;
  var useSpatial = goog.isDefAndNotNull(options['spatial']) ? options['spatial'] : false;
  var useTemporal = goog.isDefAndNotNull(options['temporal']) ? options['temporal'] :
      !!this.featureType.getStartDateColumnName();
  var featureIDs = goog.isDefAndNotNull(options['featureIDs']) ? options['featureIDs'] : null;
  var relatedLayer = goog.isDefAndNotNull(options['relatedLayer']) ? options['relatedLayer'] : null;

  // add connections to the query managers
  var qm = os.ui.queryManager;
  if (featureIDs || useTemporal || useSpatial || useFilter || useExclusions) {
    var ogcFilterOptions = /** @type {os.ogc.filter.OGCFilterModifierOptions} */ ({
      exclusions: useExclusions,
      filter: useFilter,
      identifiers: !!featureIDs || !!relatedLayer,
      spatial: useSpatial,
      temporal: useTemporal
    });

    if (useFilter) {
      layer.setFilterLauncher(plugin.ogc.wfs.launchFilterManager.bind(undefined, layer));
      layer.setFilterColumnsFn(plugin.ogc.wfs.getFilterColumns.bind(undefined, layer));
    }

    var request = source.getRequest();

    if (request) {
      request.addModifier(new os.ogc.filter.OGCFilterModifier(ogcFilterOptions));

      if (featureIDs) { // reachback via ID
        var idLayer = {'ID': featureIDs};
        var idModifier = new plugin.ogc.query.FilterIDModifier(idLayer);
        request.addModifier(idModifier);
      }

      if (relatedLayer) {
        var relateModifier = new plugin.ogc.query.FilterIDModifier(/** @type {Object} */ (relatedLayer));
        request.addModifier(relateModifier);
        source.setLockAfterQuery(true);
      }

      var geomColumn = this.featureType.getGeometryColumnName();
      if (geomColumn && (useSpatial || useExclusions || useFilter)) {
        var handler = new plugin.ogc.query.OGCQueryHandler(geomColumn);
        handler.setSource(source);
        qm.registerHandler(handler);
      }

      if (useTemporal) {
        var tqFormatter = new plugin.ogc.query.OGCTemporalFormatter();
        tqFormatter.setStartColumn(this.featureType.getStartDateColumnName());
        tqFormatter.setEndColumn(this.featureType.getEndDateColumnName());

        // THIN-7523 - hack for the case when our servers can't handle requests that go below a second
        if (this.url.indexOf('ogc/wfsServer') > -1) {
          tqFormatter.setRoundTimeEnabled();
        }

        var tqModifier = new os.net.ParamModifier('temporal', 'filter',
            os.ogc.filter.ModifierConstants.TEMPORAL, '');

        var tqHandler = new os.query.TemporalHandler();
        tqHandler.setFormatter(tqFormatter);
        tqHandler.setModifier(tqModifier);
        tqHandler.setSource(source);

        var tqManager = os.query.TemporalQueryManager.getInstance();
        tqManager.registerHandler(source.getId(), tqHandler);
      }
    }
  }
};


/**
 * Launch the filter manager
 * @param {!os.layer.Vector} layer The layer
 */
plugin.ogc.wfs.launchFilterManager = function(layer) {
  os.ui.CombinatorCtrl.launchForLayer(layer.getId());
};


/**
 * Get the filterable columns
 * @param {!os.layer.Vector} layer The layer
 * @return {?Array<os.ogc.FeatureTypeColumn>} the columns
 */
plugin.ogc.wfs.getFilterColumns = function(layer) {
  var layerOptions = layer.getLayerOptions();
  if (layerOptions && layerOptions['featureType']) {
    var featureType = /** @type {os.ogc.IFeatureType} */ (layerOptions['featureType']);
    if (featureType) {
      return featureType.getColumns();
    }
  }

  return null;
};
