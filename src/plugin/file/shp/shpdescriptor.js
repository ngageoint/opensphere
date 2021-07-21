goog.module('plugin.file.shp.SHPDescriptor');
goog.module.declareLegacyNamespace();

const FileDescriptor = goog.require('os.data.FileDescriptor');
const osFile = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const LayerType = goog.require('os.layer.LayerType');
const SHPExporter = goog.require('plugin.file.shp.SHPExporter');
const SHPParserConfig = goog.require('plugin.file.shp.SHPParserConfig');


/**
 * SHP file descriptor.
 */
class SHPDescriptor extends FileDescriptor {
  /**
   * Constructor.
   * @param {SHPParserConfig=} opt_config
   */
  constructor(opt_config) {
    super();
    this.descriptorType = 'shp';
    this.parserConfig = opt_config || new SHPParserConfig();

    /**
     * @type {?string}
     * @private
     */
    this.originalUrl2_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.url2_ = null;
  }

  /**
   * @inheritDoc
   */
  getType() {
    return LayerType.FEATURES;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = super.getLayerOptions();
    options['type'] = 'SHP';
    options['originalUrl2'] = this.getOriginalUrl2();
    options['url2'] = this.getUrl2();
    return options;
  }

  /**
   * Get the original URL for this file.
   *
   * @return {?string}
   */
  getOriginalUrl2() {
    return this.originalUrl2_;
  }

  /**
   * Set the original URL for this file.
   *
   * @param {?string} value
   */
  setOriginalUrl2(value) {
    this.originalUrl2_ = value;
  }

  /**
   * Get the URL for this descriptor.
   *
   * @return {?string}
   */
  getUrl2() {
    return this.url2_;
  }

  /**
   * Set the URL for this descriptor.
   *
   * @param {?string} value
   */
  setUrl2(value) {
    this.url2_ = value;
  }

  /**
   * @inheritDoc
   */
  matchesURL(url) {
    return url == this.getUrl() || url == this.getUrl2();
  }

  /**
   * @inheritDoc
   */
  clearData() {
    super.clearData();

    var url2 = this.getUrl2();
    if (url2 && osFile.isLocal(url2)) {
      var fs = FileStorage.getInstance();
      fs.deleteFile(url2);
    }
  }

  /**
   * @inheritDoc
   */
  getExporter() {
    return new SHPExporter();
  }

  /**
   * @inheritDoc
   */
  onFileChange(options) {
    super.onFileChange(options);

    // ensure that the URL is set correctly in case we are converting from a shp/dbf file to a zip shp file
    const url2 = this.getUrl2();
    if (url2 && osFile.isLocal(url2)) {
      const fs = FileStorage.getInstance();
      fs.deleteFile(url2);
      this.setUrl2('');
    }
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    if (!opt_obj) {
      opt_obj = {};
    }

    opt_obj['originalUrl2'] = this.getOriginalUrl2();
    opt_obj['url2'] = this.getUrl2();

    return super.persist(opt_obj);
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    this.setOriginalUrl2(conf['originalUrl2'] || null);
    this.setUrl2(conf['url2'] || null);

    super.restore(conf);
  }

  /**
   * @inheritDoc
   */
  static createFromConfig(descriptor, provider, config, opt_useDefaultColor) {
    super.createFromConfig(descriptor, provider, config);

    if (descriptor instanceof SHPDescriptor) {
      // use the ZIP file first, SHP second. the import UI uses the extracted files for easier (synchronous) processing
      // but the ZIP should be used for parsing data with the importer. ignore the DBF if we have a zip file.
      var file = config['zipFile'] || config['file'];
      descriptor.setUrl(file.getUrl());

      var file2 = config['zipFile'] ? null : config['file2'];
      if (file2) {
        descriptor.setUrl2(file2.getUrl());
      }

      descriptor.updateFromConfig(config);
    }
  }
}

exports = SHPDescriptor;
