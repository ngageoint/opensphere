goog.module('plugin.file.shp.ui.ZipSHPImportUI');

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');

const DataManager = goog.require('os.data.DataManager');
const osFile = goog.require('os.file');
const MappingManager = goog.require('os.im.mapping.MappingManager');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');
const OptionsStep = goog.require('os.ui.wiz.OptionsStep');
const TimeStep = goog.require('os.ui.wiz.step.TimeStep');
const SHPDescriptor = goog.require('plugin.file.shp.SHPDescriptor');
const SHPParserConfig = goog.require('plugin.file.shp.SHPParserConfig');
const SHPProvider = goog.require('plugin.file.shp.SHPProvider');
const mime = goog.require('plugin.file.shp.mime');
const {directiveTag: shpImportUi} = goog.require('plugin.file.shp.ui.SHPImport');

const OSFile = goog.requireType('os.file.File');


/**
 * @extends {FileImportUI.<SHPParserConfig>}
 */
class ZipSHPImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {OSFile}
     * @private
     */
    this.shpFile_ = null;

    /**
     * @type {OSFile}
     * @private
     */
    this.dbfFile_ = null;

    /**
     * @type {OSFile}
     * @private
     */
    this.zipFile_ = null;

    /**
     * @type {SHPParserConfig}
     * @private
     */
    this.config_ = null;

    /**
     * @type {!Array<!zip.Reader>}
     * @protected
     */
    this.zipReaders = [];
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    this.shpFile_ = null;
    this.dbfFile_ = null;
    this.zipFile_ = file;

    if (opt_config !== undefined) {
      this.config_ = opt_config;
    }

    const content = /** @type {ArrayBuffer|Blob} */ (file.getContent());

    if (content instanceof ArrayBuffer) {
      zip.createReader(new zip.ArrayBufferReader(content),
          this.handleZipReader.bind(this), this.handleZipReaderError.bind(this));
    } else if (content instanceof Blob) {
      // convert the blob to an ArrayBuffer and proceed down the normal path
      content.arrayBuffer().then((arrayBuffer) => {
        this.zipFile_.setContent(arrayBuffer);
        zip.createReader(new zip.ArrayBufferReader(arrayBuffer),
            this.handleZipReader.bind(this), this.handleZipReaderError.bind(this));
      }, (reason) => {
        this.handleZipReaderError(reason);
      });
    }
  }

  /**
   * @param {!zip.Reader} reader
   * @protected
   */
  handleZipReader(reader) {
    this.zipReaders.push(reader);
    reader.getEntries(this.processEntries_.bind(this));
  }

  /**
   * Handles ZIP reader errors.
   * @param {*} opt_error Optional error message/exception.
   * @protected
   */
  handleZipReaderError(opt_error) {
    // failed reading the zip file
    var msg = 'Error reading zip file!"';

    if (typeof opt_error == 'string') {
      msg += ` Details: ${opt_error}`;
    } else if (opt_error instanceof Error) {
      msg += ` Details: ${opt_error.message}.`;
    }

    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
  }

  /**
   * @param {Array.<!zip.Entry>} entries
   * @private
   */
  processEntries_(entries) {
    for (var i = 0, n = entries.length; i < n; i++) {
      var entry = entries[i];
      if (mime.SHP_EXT_REGEXP.test(entry.filename) ||
          mime.DBF_EXT_REGEXP.test(entry.filename)) {
        // if the entry is a shp or dbf, load the content and process it
        entry.getData(new zip.ArrayBufferWriter(), this.processEntry_.bind(this, entry));
      }
    }
  }

  /**
   * @param {zip.Entry} entry
   * @param {*} content
   * @private
   */
  processEntry_(entry, content) {
    if (content instanceof ArrayBuffer) {
      // only use the first file encountered, which means archives with multiple shapefiles will only load the first
      content = /** @type {!ArrayBuffer} */ (content);
      if (!this.shpFile_ && mime.SHP_EXT_REGEXP.test(entry.filename)) {
        this.shpFile_ =
            osFile.createFromContent(entry.filename, osFile.getLocalUrl(entry.filename), undefined, content);
      } else if (!this.dbfFile_ && mime.DBF_EXT_REGEXP.test(entry.filename)) {
        this.dbfFile_ =
            osFile.createFromContent(entry.filename, osFile.getLocalUrl(entry.filename), undefined, content);
      }
    }

    if (this.shpFile_ && this.dbfFile_) {
      this.launchUIInternal_();
    }
  }

  /**
   * @private
   */
  launchUIInternal_() {
    if (this.shpFile_ && this.dbfFile_) {
      var config = new SHPParserConfig();
      let defaultImport = false;

      // if a configuration was provided, merge it in
      if (this.config_) {
        defaultImport = this.config_['defaultImport'] || false;
        this.mergeConfig(this.config_, config);
        this.config_ = null;
      }

      config['file'] = this.shpFile_;
      config['file2'] = this.dbfFile_;
      config['zipFile'] = this.zipFile_;
      config['title'] = this.zipFile_.getFileName();

      // generate preview data from the config and try to auto detect mappings
      config.updatePreview();
      var features = config['preview'];
      if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
        // no mappings have been set yet, so try to auto detect them
        var mm = MappingManager.getInstance();
        var mappings = mm.autoDetect(features);
        if (mappings && mappings.length > 0) {
          config['mappings'] = mappings;
        }
      }

      if (defaultImport) {
        this.handleDefaultImport(this.shpFile_, config);
        return;
      }

      var steps = [
        new TimeStep(),
        new OptionsStep()
      ];

      var scopeOptions = {
        'config': config,
        'steps': steps
      };
      var windowOptions = {
        'label': 'SHP Import',
        'icon': 'fa fa-sign-in',
        'x': 'center',
        'y': 'center',
        'width': '850',
        'min-width': '500',
        'max-width': '1200',
        'height': '650',
        'min-height': '300',
        'max-height': '1000',
        'modal': 'true',
        'show-close': 'true'
      };
      var template = `<${shpImportUi} resize-with="${windowSelector.WINDOW}"></${shpImportUi}>`;
      osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
    } else {
      var msg = 'Zip file does not contain both SHP and DBF files!';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    }

    // drop file references once the UI is launched
    this.zipReaders.forEach(function(reader) {
      reader.close();
    });
    this.zipReaders.length = 0;
    this.shpFile_ = null;
    this.dbfFile_ = null;
    this.zipFile_ = null;
  }

  /**
   * @inheritDoc
   */
  handleDefaultImport(file, config) {
    config = this.getDefaultConfig(file, config);

    // create the descriptor and add it
    if (config) {
      const provider = SHPProvider.getInstance();
      const descriptor = new SHPDescriptor(config);
      SHPDescriptor.createFromConfig(descriptor, provider, config);

      DataManager.getInstance().addDescriptor(descriptor);
      provider.addDescriptor(descriptor);
      descriptor.setActive(true);
    }
  }
}

exports = ZipSHPImportUI;
