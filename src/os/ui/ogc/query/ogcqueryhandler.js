goog.declareModuleId('os.ui.ogc.query.OGCQueryHandler');

import ParamModifier from '../../../net/parammodifier.js';
import ModifierConstants from '../../../ogc/filter/modifierconstants.js';
import OGCExclusionFormatter from '../../../ogc/filter/ogcexclusionformatter.js';
import OGCFilterFormatter from '../../../ogc/filter/ogcfilterformatter.js';
import OGCSpatialFormatter from '../../../ogc/filter/ogcspatialformatter.js';
import QueryHandler from '../../query/queryhandler.js';


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
