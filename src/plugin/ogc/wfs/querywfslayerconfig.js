goog.declareModuleId('plugin.ogc.wfs.QueryWFSLayerConfig');

import ParamModifier from '../../../os/net/parammodifier.js';
import ModifierConstants from '../../../os/ogc/filter/modifierconstants.js';
import OGCFilterModifier from '../../../os/ogc/filter/ogcfiltermodifier.js';
import {getQueryManager} from '../../../os/query/queryinstance.js';
import TemporalHandler from '../../../os/query/temporalhandler.js';
import TemporalQueryManager from '../../../os/query/temporalquerymanager.js';
import FilterIDModifier from '../query/filteridmodifier.js';
import OGCQueryHandler from '../query/ogcqueryhandler.js';
import OGCTemporalFormatter from '../query/ogctemporalformatter.js';
import getFilterColumns from './getfiltercolumns.js';
import launchFilterManager from './launchfiltermanager.js';
import WFSLayerConfig from './wfslayerconfig.js';


/**
 * The query version of the WFS layer config, which adds connections to various query managers
 * to automatically requery when combinations of areas, filters, and layers change.
 */
export default class QueryWFSLayerConfig extends WFSLayerConfig {
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

    var source = /** @type {RequestSource} */ (layer.getSource());
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
