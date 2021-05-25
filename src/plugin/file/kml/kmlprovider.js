goog.module('plugin.file.kml.KMLProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * KML file provider
 */
class KMLProvider extends FileProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setId('kml');
    this.setLabel('KML Files');
  }
}
goog.addSingletonGetter(KMLProvider);


exports = KMLProvider;
