goog.module('plugin.arc.query.ArcSpatialModifier');
goog.module.declareLegacyNamespace();

const ParamModifier = goog.require('os.net.ParamModifier');


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

exports = ArcSpatialModifier;
