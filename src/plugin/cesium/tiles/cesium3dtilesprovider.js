goog.declareModuleId('plugin.cesium.tiles.Provider');

import BaseDescriptor from '../../../os/data/basedescriptor.js';
import DataManager from '../../../os/data/datamanager.js';
import FileProvider from '../../../os/data/fileprovider.js';
import {ID, TYPE} from './cesium3dtiles.js';

const {default: TilesDescriptor} = goog.requireType('plugin.cesium.tiles.Descriptor');


/**
 * The global instance.
 * @type {Provider|undefined}
 */
let instance;


/**
 * Cesium 3D tiles provider.
 */
export default class Provider extends FileProvider {
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
    this.setId(ID);
    this.setLabel(TYPE);

    var layers = config['layers'];
    if (layers) {
      var dm = DataManager.getInstance();
      for (var key in layers) {
        var id = this.getId() + BaseDescriptor.ID_DELIMITER + key;
        var d = /** @type {TilesDescriptor} */ (dm.getDescriptor(id));

        if (!d) {
          d = /** @type {TilesDescriptor} */ (dm.createDescriptor(ID));
          d.setId(id);
          dm.addDescriptor(d);
        }

        d.updateFromConfig(layers[key]);
        d.updateActiveFromTemp();
      }
    }
  }

  /**
   * Get the global instance.
   * @return {!Provider} The instance.
   */
  static getInstance() {
    if (!instance) {
      instance = new Provider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Provider|undefined} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}
