goog.module('plugin.arc.query.ArcFilterModifier');
goog.module.declareLegacyNamespace();

const ParamModifier = goog.require('os.net.ParamModifier');


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

exports = ArcFilterModifier;
