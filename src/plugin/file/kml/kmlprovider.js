goog.declareModuleId('plugin.file.kml.KMLProvider');

const FileProvider = goog.require('os.data.FileProvider');


/**
 * KML file provider
 */
export default class KMLProvider extends FileProvider {
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
