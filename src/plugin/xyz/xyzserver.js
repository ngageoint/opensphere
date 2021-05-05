goog.module('plugin.xyz.XYZServer');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');
const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const DataManager = goog.require('os.data.DataManager');
const osLayer = goog.require('os.layer');
const {ID_DELIMITER} = goog.require('os.ui.data.BaseProvider');
const DescriptorProvider = goog.require('os.ui.data.DescriptorProvider');

const Logger = goog.requireType('goog.log.Logger');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const BaseParserConfig = goog.requireType('os.parse.BaseParserConfig');


/**
 * The XYZ server provider.
 * TBD: rename to "xyzprovider" and remove all references to "server"
 */
class XYZServer extends DescriptorProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The logger.
     * @const
     * @type {Logger}
     * @private
     */
    this.log_ = log.getLogger('plugin.xyz.XYZServer');

    /**
     * The config of the provider
     * @type {BaseParserConfig}
     * @private
     */
    this.config_ = false;

    /**
     * Whether or not the provider is in a loading state
     * @type {boolean}
     * @private
     */
    this.isLoading_ = false;

    /**
     * @type {string}
     * @private
     */
    this.label_ = 'XYZ Layers';


    /**
     * @type {boolean}
     */
    this.listInServers = false;

    /**
     * @type {boolean}
     */
    this.showWhenEmpty = false;

    /**
     * The XYZ server type.
     * @type {string}
     * @const
     */
    this.providerType = 'xyzserver';
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.config_ = config;
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    this.setLoading(true);

    const dm = DataManager.getInstance();

    const projectionObject = this.config_['projectionObject'] ? this.config_['projectionObject']
      : this.config_['projection'];
    const projectionCode = projectionObject['code'];
    this.config_['projectionObject'] = projectionObject;
    this.config_['projection'] = projectionCode;
    this.config_['title'] = this.config_['label'];

    var descriptor = this.createXYZDescriptor(this.config_);
    const layerId = `${descriptor.getId()}${ID_DELIMITER}${getRandomString()}`;
    this.config_['id'] = layerId;

    var layer = osLayer.createFromOptions(this.config_);
    if (layer) {
      this.setLoading(false);
      descriptor.addLayer(layer);
    }

    dm.addDescriptor(descriptor);
    this.addDescriptor(descriptor);

    // TBD: persist the descriptor and its layers

    this.setLoading(false);
  }

  /**
   * Create an XYZ descriptor from an XYZ layer config.
   * @param {!Object} layerConfig The XYZ layer config.
   * @return {IDataDescriptor} The descriptor, or null if one could not be created.
   */
  createXYZDescriptor(layerConfig) {
    let descriptor = null;
    descriptor = new ConfigDescriptor();

    const descriptorId = `${this.getId()}${ID_DELIMITER}${getRandomString()}${ID_DELIMITER}tiles`;
    descriptor.setId(descriptorId);
    descriptor.setBaseConfig(layerConfig);

    return descriptor;
  }

  /**
   * Set if the provider is in a loading state.
   * @param {boolean} value
   */
  setLoading(value) {
    if (this.isLoading_ != value) {
      this.isLoading_ = value;
      this.dispatchEvent(new os.events.PropertyChangeEvent('loading', value, !value));
    }
  }

  /**
   * @return {boolean}
   */
  isLoading() {
    return this.loading_;
  }
}


exports = XYZServer;
