goog.declareModuleId('plugin.file.shp.SHPProvider');

const FileProvider = goog.require('os.data.FileProvider');


/**
 * SHP file provider
 */
export default class SHPProvider extends FileProvider {
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
