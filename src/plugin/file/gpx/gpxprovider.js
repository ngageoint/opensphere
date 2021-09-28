goog.declareModuleId('plugin.file.gpx.GPXProvider');

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GPX file provider
 */
export default class GPXProvider extends FileProvider {
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
    this.setId('gpx');
    this.setLabel('GPX Files');
  }
}

goog.addSingletonGetter(GPXProvider);
