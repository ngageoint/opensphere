goog.module('os.ui.ogc.query.OGCQueryHandler');
goog.module.declareLegacyNamespace();

const ParamModifier = goog.require('os.net.ParamModifier');
const ModifierConstants = goog.require('os.ogc.filter.ModifierConstants');
const OGCExclusionFormatter = goog.require('os.ogc.filter.OGCExclusionFormatter');
const OGCFilterFormatter = goog.require('os.ogc.filter.OGCFilterFormatter');
const OGCSpatialFormatter = goog.require('os.ogc.filter.OGCSpatialFormatter');
const QueryHandler = goog.require('os.ui.query.QueryHandler');


/**
 */
class OGCQueryHandler extends QueryHandler {
  /**
   * Constructor.
   * @param {string=} opt_geomColumn
   */
  constructor(opt_geomColumn) {
    super();
    this.setModifier(new ParamModifier('filter', 'filter', ModifierConstants.FILTER, ''));
    this.setAreaFormatter(new OGCSpatialFormatter(opt_geomColumn));
    this.setExclusionFormatter(new OGCExclusionFormatter(opt_geomColumn));
    this.setFilterFormatter(new OGCFilterFormatter());
    this.spatialRequired = true;
  }
}

exports = OGCQueryHandler;
