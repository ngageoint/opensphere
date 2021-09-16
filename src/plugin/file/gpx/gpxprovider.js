goog.module('plugin.file.gpx.GPXProvider');

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GPX file provider
 */
class GPXProvider extends FileProvider {
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


exports = GPXProvider;
