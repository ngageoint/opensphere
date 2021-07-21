goog.module('os.im.ImportProcess');
goog.module.declareLegacyNamespace();

const FileParserConfig = goog.require('os.parse.FileParserConfig');
const {getConfigColor} = goog.require('os.style');
const StyleManager = goog.require('os.style.StyleManager');
const DuplicateImportProcess = goog.require('os.ui.im.DuplicateImportProcess');

const FileDescriptor = goog.requireType('os.data.FileDescriptor');


/**
 */
class ImportProcess extends DuplicateImportProcess {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {boolean}
     * @protected
     */
    this.skipDuplicates = false;
  }

  /**
   * @param {boolean} value
   */
  setSkipDuplicates(value) {
    this.skipDuplicates = value;
  }

  /**
   * @inheritDoc
   */
  onFileExists() {
    if (this.skipDuplicates) {
      this.reimport();
    } else {
      super.onFileExists();
    }
  }

  /**
   * @inheritDoc
   */
  onUrlExists() {
    if (this.skipDuplicates) {
      this.reimport();
    } else {
      super.onUrlExists();
    }
  }

  /**
   * @inheritDoc
   */
  reimport() {
    // keep track of the descriptor so we can update it after import
    var url = /** @type {string} */ (this.file.getUrl());
    var desc = this.getDescriptorByUrl(url);
    var config = new FileParserConfig();

    // this uses duck typing to avoid a circular dependency with FileDescriptor
    if (desc && typeof /** @type {FileDescriptor} */ (desc).getParserConfig === 'function') {
      desc = /** @type {FileDescriptor} */ (desc);
      config = desc.getParserConfig();
    }

    config['descriptor'] = desc;
    config['replace'] = true;

    // check for a layer config to get the most recent layer color
    var layerConfig = StyleManager.getInstance().getLayerConfig(desc.getId());
    if (layerConfig) {
      config['color'] = getConfigColor(layerConfig);
    }

    this.importFile(config);
  }
}

exports = ImportProcess;
