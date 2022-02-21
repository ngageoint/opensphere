goog.declareModuleId('plugin.arc.query.ArcSpatialModifier');

import ParamModifier from '../../../os/net/parammodifier.js';


/**
 */
class ArcSpatialModifier extends ParamModifier {
  /**
   * Constructor.
   */
  constructor() {
    super('ArcSpatial', 'geometry', '', '', 100);
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
    var replacement = this.getReplacement();
    if (replacement) {
      uri.getQueryData().set('geometry', replacement);
    }
  }
}

export default ArcSpatialModifier;
