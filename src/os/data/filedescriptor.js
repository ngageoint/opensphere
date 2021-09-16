goog.module('os.data.FileDescriptor');

const log = goog.require('goog.log');
const Settings = goog.require('os.config.Settings');
const IMappingDescriptor = goog.require('os.data.IMappingDescriptor');
const IUrlDescriptor = goog.require('os.data.IUrlDescriptor');
const LayerSyncDescriptor = goog.require('os.data.LayerSyncDescriptor');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osFile = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const ImportProcess = goog.require('os.im.ImportProcess');
const MappingManager = goog.require('os.im.mapping.MappingManager');
const osImplements = goog.require('os.implements');
const VectorLayer = goog.require('os.layer.Vector');
const FileParserConfig = goog.require('os.parse.FileParserConfig');
const osSource = goog.require('os.source');
const PropertyChange = goog.require('os.source.PropertyChange');
const VectorSource = goog.require('os.source.Vector');
const osStyle = goog.require('os.style');
const Icons = goog.require('os.ui.Icons');
const ExportManager = goog.require('os.ui.file.ExportManager');
const {directiveTag: nodeUi} = goog.require('os.ui.file.ui.DefaultFileNodeUI');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');

const IReimport = goog.requireType('os.data.IReimport');
const IExportMethod = goog.requireType('os.ex.IExportMethod');
const RequestSource = goog.requireType('os.source.Request');


/**
 * An abstract {@link os.data.IDataDescriptor} implementation that is intended to be used by the various filetype
 * providers (KML, CSV, etc.).
 *
 * @implements {IMappingDescriptor}
 * @implements {IUrlDescriptor}
 * @implements {IReimport}
 */
class FileDescriptor extends LayerSyncDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?string}
     * @private
     */
    this.originalUrl_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.url_ = null;

    /**
     * @type {FileParserConfig}
     * @protected
     */
    this.parserConfig = new FileParserConfig();

    /**
     * @type {?osx.icon.Icon}
     * @private
     */
    this.icon_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.shapeName_ = null;

    /**
     * @type {?Date}
     * @private
     */
    this.date_ = null;

    this.log = logger;
    this.descriptorType = 'file';
  }

  /**
   * @inheritDoc
   */
  getSearchType() {
    return 'Layer';
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return Icons.FEATURES;
  }

  /**
   * @return {?osx.icon.Icon}
   */
  getIcon() {
    return this.icon_;
  }

  /**
   * @return {?string}
   */
  getShapeName() {
    return this.shapeName_;
  }

  /**
   * Get the Date for this descriptor.
   *
   * @return {?Date}
   */
  getDate() {
    return this.date_;
  }

  /**
   * Set the Date for this descriptor.
   *
   * @param {?Date} value
   */
  setDate(value) {
    this.date_ = value;
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return `<${nodeUi}></${nodeUi}>`;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = {};
    options['id'] = this.getId();

    options['animate'] = true; // TODO: add checkbox to toggle this in import UI
    options['color'] = this.getColor();
    options['icon'] = this.getIcon();
    options['shapeName'] = this.getShapeName();
    options['load'] = true;
    options['originalUrl'] = this.getOriginalUrl();
    options['parserConfig'] = this.parserConfig;
    options['provider'] = this.getProvider();
    options['tags'] = this.getTags();
    options['title'] = this.getTitle();
    options['url'] = this.getUrl();
    options['mappings'] = this.getMappings();
    options['detectColumnTypes'] = true;

    return options;
  }

  /**
   * @inheritDoc
   */
  getMappings() {
    return this.parserConfig['mappings'];
  }

  /**
   * @inheritDoc
   */
  setMappings(value) {
    this.parserConfig['mappings'] = value;
  }

  /**
   * @inheritDoc
   */
  updateMappings(layer) {
    const source = /** @type {RequestSource} */ (layer.getSource());
    const importer = source.getImporter();

    this.saveDescriptor();
    importer.setMappings(this.getMappings());
    source.refresh();
  }

  /**
   * @inheritDoc
   */
  supportsMapping() {
    return false;
  }

  /**
   * Get the original URL for this file.
   *
   * @return {?string}
   */
  getOriginalUrl() {
    return this.originalUrl_;
  }

  /**
   * Set the original URL for this file.
   *
   * @param {?string} value
   */
  setOriginalUrl(value) {
    this.originalUrl_ = value;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @inheritDoc
   */
  setUrl(value) {
    this.url_ = value;
  }

  /**
   * @inheritDoc
   */
  matchesURL(url) {
    return url == this.getUrl();
  }

  /**
   * @return {FileParserConfig}
   */
  getParserConfig() {
    return this.parserConfig;
  }

  /**
   * @param {FileParserConfig} config
   */
  setParserConfig(config) {
    this.parserConfig = config;
    this.layerConfig = {};
  }

  /**
   * @inheritDoc
   */
  setColor(value) {
    this.parserConfig['color'] = value;
    super.setColor(value);
  }

  /**
   * @param {!osx.icon.Icon} value
   */
  setIcon(value) {
    this.parserConfig['icon'] = value;
    this.icon_ = value;
  }

  /**
   * @param {?string} value
   */
  setShapeName(value) {
    this.parserConfig['shapeName'] = value;
    this.shapeName_ = value;
  }

  /**
   * @inheritDoc
   */
  setDescription(value) {
    this.parserConfig['description'] = value;
    super.setDescription(value);
  }

  /**
   * @inheritDoc
   */
  setTags(value) {
    this.parserConfig['tags'] = value ? value.join(', ') : '';
    super.setTags(value);
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    this.parserConfig['title'] = value;
    super.setTitle(value);
  }

  /**
   * @inheritDoc
   */
  clearData() {
    // permanently remove associated file contents from the application/storage
    var url = this.getUrl();
    if (url && osFile.isLocal(url)) {
      var fs = FileStorage.getInstance();
      fs.deleteFile(url);
    }
  }

  /**
   * @inheritDoc
   */
  canReimport() {
    return true;
  }

  /**
   * @inheritDoc
   */
  reimport() {
    var evt = new ImportEvent(ImportEventType.URL, this.getOriginalUrl() || this.getUrl());

    var process = new ImportProcess();
    process.setEvent(evt);
    process.setConfig(this.getParserConfig());
    process.setSkipDuplicates(true);
    process.begin();
  }

  /**
   * Get the exporter method associated with this file type.
   * @return {?IExportMethod}
   */
  getExporter() {
    return null;
  }

  /**
   * @inheritDoc
   */
  onLayerChange(e) {
    super.onLayerChange(e);

    if (e instanceof PropertyChangeEvent) {
      const layer = /** @type {os.layer.Vector} */ (e.target);
      const p = e.getProperty() || '';
      const newVal = e.getNewValue();

      if (p == PropertyChange.HAS_MODIFICATIONS && newVal) {
        if (layer instanceof VectorLayer) {
          const source = /** @type {VectorSource} */ (layer.getSource());
          const settings = Settings.getInstance();
          const key = osFile.FileSetting.AUTO_SAVE;

          if (settings.get(key, osFile.FileSettingDefault[key]) && source instanceof VectorSource) {
            const options = /** @type {os.ex.ExportOptions} */ ({
              sources: [source],
              items: source.getFeatures(),
              fields: null
            });

            this.updateFile(options);
          }
        }
      }
    }
  }

  /**
   * Updates to the underlying layer data. Updates the file in storage.
   * @param {os.ex.ExportOptions} options
   */
  updateFile(options) {
    const source = /** @type {VectorSource} */ (options.sources[0]);
    const exporter = this.getExporter();

    if (exporter) {
      const name = this.getTitle() || 'New File';
      options.exporter = exporter;
      options.fields = osSource.getExportFields(source, false, exporter.supportsTime());
      options.title = name;
      options.keepTitle = true;

      // export via export manager, this will not prompt the user
      // possible TODO: have this function return a promise that resolves/rejects if the export succeeds/fails
      ExportManager.getInstance().exportItems(options);

      this.onFileChange(options);
    }
  }

  /**
   * Handles changes to the underlying layer data. Updates the file in storage.
   * @param {os.ex.ExportOptions} options
   */
  onFileChange(options) {
    // update this descriptor's URL to point to the file, set the source back to having no modifications
    const name = this.getTitle() || 'New File';
    const url = osFile.getLocalUrl(name);
    this.setUrl(url);

    const source = /** @type {VectorSource} */ (options.sources[0]);
    source.setHasModifications(false);
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    if (!opt_obj) {
      opt_obj = {};
    }

    opt_obj['originalUrl'] = this.originalUrl_;
    opt_obj['url'] = this.url_;
    opt_obj['icon'] = this.getIcon();
    opt_obj['shapeName'] = this.getShapeName();
    opt_obj['date'] = this.getDate();

    var mappings = this.getMappings();
    if (mappings) {
      var mm = MappingManager.getInstance();
      opt_obj['mappings'] = mm.persistMappings(mappings);
    }

    return super.persist(opt_obj);
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    this.setOriginalUrl(conf['originalUrl'] || null);
    this.setUrl(conf['url'] || null);
    this.setIcon(conf['icon']);
    this.setShapeName(conf['shapeName']);
    this.setDate(conf['date'] || null);

    if (conf['mappings']) {
      var mm = MappingManager.getInstance();
      this.setMappings(mm.restoreMappings(conf['mappings']));
    }

    super.restore(conf);
    this.updateActiveFromTemp();
  }

  /**
   * Updates an existing descriptor from a parser configuration.
   *
   * @param {!FileParserConfig} config
   * @param {boolean=} opt_isNotParserConfig Set to true to not use the the config as the parser config
   */
  updateFromConfig(config, opt_isNotParserConfig) {
    this.setDescription(config['description']);
    this.setColor(config['color']);
    this.setIcon(config['icon']);
    this.setShapeName(config['shapeName']);
    this.setTitle(config['title']);
    this.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
    this.setDate(config['date']);
    if (!opt_isNotParserConfig) {
      this.setParserConfig(config);
    }
  }

  /**
   * Creates a new descriptor from a parser configuration.
   *
   * @param {!os.data.FileDescriptor} descriptor
   * @param {!os.data.FileProvider} provider
   * @param {!FileParserConfig} config
   * @param {?string=} opt_useDefaultColor
   */
  static createFromConfig(descriptor, provider, config, opt_useDefaultColor) {
    var file = config['file'];
    descriptor.setId(/** @type {string} */ (config['id']) || provider.getUniqueId());
    descriptor.setProvider(provider.getLabel());
    if (file) {
      descriptor.setUrl(file.getUrl());
    }
    if (opt_useDefaultColor) {
      descriptor.setColor(osStyle.DEFAULT_LAYER_COLOR);
    }
    descriptor.updateFromConfig(config);
  }
}
osImplements(FileDescriptor, IMappingDescriptor.ID);
osImplements(FileDescriptor, 'os.data.IReimport');
osImplements(FileDescriptor, IUrlDescriptor.ID);


/**
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.data.FileDescriptor');


exports = FileDescriptor;
