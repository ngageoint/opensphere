goog.declareModuleId('plugin.file.csv.CSVProvider');

const FileProvider = goog.require('os.data.FileProvider');


/**
 * CSV file provider
 */
export default class CSVProvider extends FileProvider {
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
