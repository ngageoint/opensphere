goog.declareModuleId('plugin.cesium.tiles.Descriptor');

import FileDescriptor from '../../../os/data/filedescriptor.js';
import ColorControlType from '../../../os/ui/colorcontroltype.js';
import ControlType from '../../../os/ui/controltype.js';
import {getIonUrl} from '../cesium.js';
import {ICON, ID} from './cesium3dtiles.js';
import Provider from './cesium3dtilesprovider.js';

const {default: FileParserConfig} = goog.requireType('os.parse.FileParserConfig');


/**
 * Cesium 3D tiles descriptor.
 */
export default class Descriptor extends FileDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.descriptorType = ID;

    /**
     * Cesium Ion asset id.
     * @type {number}
     * @protected
     */
    this.assetId = NaN;

    /**
     * Cesium Ion access token.
     * @type {string}
     * @protected
     */
    this.accessToken = '';

    /**
     * Cesium 3D tiles style.
     * @type {Object|string}
     * @protected
     */
    this.tileStyle = null;

    /**
     * If Cesium World Terrain should be activated with this layer.
     * @type {boolean}
     * @protected
     */
    this.useWorldTerrain = false;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return ICON;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = super.getLayerOptions();
    options['type'] = ID;

    // allow resetting the layer color to the default
    options[ControlType.COLOR] = ColorControlType.PICKER_RESET;

    // add Ion config
    if (!isNaN(this.assetId)) {
      options['assetId'] = this.assetId;
      options['accessToken'] = this.accessToken;
    }

    if (this.tileStyle) {
      options['tileStyle'] = this.tileStyle;
    }

    options['useWorldTerrain'] = this.useWorldTerrain;

    return options;
  }

  /**
   * Set the Ion asset configuration.
   *
   * @param {number} assetId The asset id.
   * @param {string=} opt_accessToken The access token.
   */
  setIonConfig(assetId, opt_accessToken) {
    this.assetId = assetId;

    if (opt_accessToken) {
      this.accessToken = opt_accessToken;
    }

    // set a URL so the descriptor gets persisted
    this.setUrl(getIonUrl());
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    var obj = super.persist(opt_obj);
    obj['assetId'] = this.assetId;
    obj['accessToken'] = this.accessToken;

    return obj;
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    if (typeof conf['assetId'] == 'number') {
      this.assetId = /** @type {number} */ (conf['assetId']);
    }

    if (conf['accessToken']) {
      this.accessToken = /** @type {string} */ (conf['accessToken']);
    }

    super.restore(conf);
  }

  /**
   * @inheritDoc
   */
  updateFromConfig(config, opt_useConfigForParser) {
    super.updateFromConfig(config, true);

    if (typeof config['assetId'] == 'number') {
      this.setIonConfig(
          /** @type {number} */ (config['assetId']),
          /** @type {string|undefined} */ (config['accessToken']));
    }

    if (config['tileStyle'] != null) {
      this.tileStyle = /** @type {Object|string} */ (config['tileStyle']);
    }

    if (config['useWorldTerrain'] != null) {
      this.useWorldTerrain = !!config['useWorldTerrain'];
    }
  }

  /**
   * Creates a new descriptor from a parser configuration.
   *
   * @param {!Object} config
   * @return {!Descriptor}
   */
  static create(config) {
    var descriptor = new Descriptor();
    var provider = Provider.getInstance();
    FileDescriptor.createFromConfig(descriptor, provider, /** @type {!FileParserConfig} */ (config));
    return descriptor;
  }
}
