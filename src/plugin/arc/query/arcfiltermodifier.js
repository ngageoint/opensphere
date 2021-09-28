goog.declareModuleId('plugin.arc.query.ArcFilterModifier');

import ParamModifier from '../../../os/net/parammodifier.js';


/**
 */
class ArcFilterModifier extends ParamModifier {
  /**
   * Constructor.
   */
  constructor() {
    super('ArcFilter', 'where', '', '', 100);
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
    var replacement = this.getReplacement();
    if (replacement) {
      uri.getQueryData().set('where', replacement);
    } else {
      uri.getQueryData().remove('where');
    }
  }
}

export default ArcFilterModifier;
