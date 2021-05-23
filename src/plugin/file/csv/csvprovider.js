goog.module('plugin.file.csv.CSVProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * CSV file provider
 */
class CSVProvider extends FileProvider {
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
    this.setId('csv');
    this.setLabel('CSV Files');
  }
}
goog.addSingletonGetter(CSVProvider);


exports = CSVProvider;
