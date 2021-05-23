goog.module('plugin.file.shp.SHPProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * SHP file provider
 */
class SHPProvider extends FileProvider {
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
    this.setId('shp');
    this.setLabel('SHP Files');
  }
}
goog.addSingletonGetter(SHPProvider);


exports = SHPProvider;
