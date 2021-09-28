goog.declareModuleId('os.map.terrain');

import * as dispatcher from '../dispatcher.js';

const log = goog.require('goog.log');


/**
 * Terrain event types.
 * @enum {string}
 */
export const TerrainEventType = {
  PROVIDERS: 'terrain:providers'
};

/**
 * Terrain settings keys.
 * @enum {string}
 */
export const TerrainSetting = {
  ACTIVE_TERRAIN: 'os.map.terrain.activeTerrainId'
};

/**
 * Supported terrain types.
 * @enum {string}
 */
export const TerrainType = {
  CESIUM: 'cesium',
  ION: 'cesium-ion',
  WMS: 'wms'
};


/**
 * The module log.
 * @type {log.Logger}
 */
const logger = log.getLogger('os.map.terrain');


/**
 * Terrain providers registered in the application.
 * @type {!Array<!osx.map.TerrainProviderOptions>}
 */
const providers = [];


/**
 * If a terrain provider is available.
 * @return {boolean}
 */
export const hasTerrain = () => providers.length > 0;


/**
 * If terrain provider options are valid.
 * @param {osx.map.TerrainProviderOptions} options The terrain provider options.
 * @return {boolean}
 */
const isValidProvider = (options) => options != null && !!options.id && !!options.type;


/**
 * Add a terrain provider to the application.
 * @param {!osx.map.TerrainProviderOptions} options The terrain provider options.
 */
export const addTerrainProvider = (options) => {
  if (isValidProvider(options)) {
    if (!options.name) {
      options.name = 'Unknown Terrain Provider';
    }

    if (!providers.some((p) => p.id === options.id)) {
      providers.push(options);
      dispatcher.getInstance().dispatchEvent(TerrainEventType.PROVIDERS);
    } else {
      log.warning(logger, `Ignoring duplicate terrain provider ${options.name} with id '${options.id}'`);
    }
  } else {
    log.error(logger, `Ignoring invalid terrain provider: '${JSON.stringify(options)}'`);
  }
};

/**
 * Get terrain providers registered with the application.
 * @return {!Array<!osx.map.TerrainProviderOptions>}
 */
export const getTerrainProviders = () => providers;
