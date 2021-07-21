goog.module('plugin.ogc.query.OGCQueryHandler');
goog.module.declareLegacyNamespace();

const ParamModifier = goog.require('os.net.ParamModifier');
const ModifierConstants = goog.require('os.ogc.filter.ModifierConstants');
const OGCFilterFormatter = goog.require('os.ogc.filter.OGCFilterFormatter');
const QueryHandler = goog.require('os.query.QueryHandler');
const OGCExclusionFormatter = goog.require('plugin.ogc.query.OGCExclusionFormatter');
const OGCSpatialFormatter = goog.require('plugin.ogc.query.OGCSpatialFormatter');


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
