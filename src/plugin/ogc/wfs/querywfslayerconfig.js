goog.module('plugin.ogc.wfs.QueryWFSLayerConfig');

const ParamModifier = goog.require('os.net.ParamModifier');
const ModifierConstants = goog.require('os.ogc.filter.ModifierConstants');
const OGCFilterModifier = goog.require('os.ogc.filter.OGCFilterModifier');
const TemporalHandler = goog.require('os.query.TemporalHandler');
const TemporalQueryManager = goog.require('os.query.TemporalQueryManager');
const {getQueryManager} = goog.require('os.query.instance');
const FilterIDModifier = goog.require('plugin.ogc.query.FilterIDModifier');
const OGCQueryHandler = goog.require('plugin.ogc.query.OGCQueryHandler');
const OGCTemporalFormatter = goog.require('plugin.ogc.query.OGCTemporalFormatter');
const WFSLayerConfig = goog.require('plugin.ogc.wfs.WFSLayerConfig');
const getFilterColumns = goog.require('plugin.ogc.wfs.getFilterColumns');
const launchFilterManager = goog.require('plugin.ogc.wfs.launchFilterManager');

const OGCFilterModifierOptions = goog.requireType('os.ogc.filter.OGCFilterModifierOptions');


/**
 * The query version of the WFS layer config, which adds connections to various query managers
 * to automatically requery when combinations of areas, filters, and layers change.
 */
class QueryWFSLayerConfig extends WFSLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  addMappings(layer, options) {
    super.addMappings(layer, options);

    var source = /** @type {os.source.Request} */ (layer.getSource());
    var useExclusions = options['exclusions'] != null ? options['exclusions'] : false;
    var useFilter = options['filter'] != null ? options['filter'] : false;
    var useSpatial = options['spatial'] != null ? options['spatial'] : false;
    var useTemporal = options['temporal'] != null ? options['temporal'] : !!this.featureType.getStartDateColumnName();
    var featureIDs = options['featureIDs'] != null ? options['featureIDs'] : null;
    var relatedLayer = options['relatedLayer'] != null ? options['relatedLayer'] : null;

    // add connections to the query managers
    var qm = getQueryManager();
    if (featureIDs || useTemporal || useSpatial || useFilter || useExclusions) {
      var ogcFilterOptions = /** @type {OGCFilterModifierOptions} */ ({
        exclusions: useExclusions,
        filter: useFilter,
        identifiers: !!featureIDs || !!relatedLayer,
        spatial: useSpatial,
        temporal: useTemporal
      });

      if (useFilter) {
        layer.setFilterLauncher(launchFilterManager.bind(undefined, layer));
        layer.setFilterColumnsFn(getFilterColumns.bind(undefined, layer));
      }

      var request = source.getRequest();

      if (request) {
        request.addModifier(new OGCFilterModifier(ogcFilterOptions));

        if (featureIDs) { // reachback via ID
          var idLayer = {'ID': featureIDs};
          var idModifier = new FilterIDModifier(idLayer);
          request.addModifier(idModifier);
        }

        if (relatedLayer) {
          var relateModifier = new FilterIDModifier(/** @type {Object} */ (relatedLayer));
          request.addModifier(relateModifier);
          source.setLockAfterQuery(true);
        }

        var geomColumn = this.featureType.getGeometryColumnName();
        if (geomColumn && (useSpatial || useExclusions || useFilter)) {
          var handler = new OGCQueryHandler(geomColumn);
          handler.setSource(source);
          qm.registerHandler(handler);
        }

        if (useTemporal) {
          var tqFormatter = new OGCTemporalFormatter();
          tqFormatter.setStartColumn(this.featureType.getStartDateColumnName());
          tqFormatter.setEndColumn(this.featureType.getEndDateColumnName());

          // THIN-7523 - hack for the case when our servers can't handle requests that go below a second
          if (this.url.indexOf('ogc/wfsServer') > -1) {
            tqFormatter.setRoundTimeEnabled();
          }

          var tqModifier = new ParamModifier('temporal', 'filter',
              ModifierConstants.TEMPORAL, '');

          var tqHandler = new TemporalHandler();
          tqHandler.setFormatter(tqFormatter);
          tqHandler.setModifier(tqModifier);
          tqHandler.setSource(source);

          var tqManager = TemporalQueryManager.getInstance();
          tqManager.registerHandler(source.getId(), tqHandler);
        }
      }
    }
  }
}

exports = QueryWFSLayerConfig;
