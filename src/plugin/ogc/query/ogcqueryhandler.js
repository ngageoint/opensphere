goog.declareModuleId('plugin.ogc.query.OGCQueryHandler');

import ParamModifier from '../../../os/net/parammodifier.js';
import ModifierConstants from '../../../os/ogc/filter/modifierconstants.js';
import OGCFilterFormatter from '../../../os/ogc/filter/ogcfilterformatter.js';
import QueryHandler from '../../../os/query/queryhandler.js';


import OGCExclusionFormatter from './ogcexclusionformatter.js';
import OGCSpatialFormatter from './ogcspatialformatter.js';


/**
 */
export default class OGCQueryHandler extends QueryHandler {
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
