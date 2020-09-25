goog.module('os.map.terrain');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');

const Settings = goog.require('os.config.Settings');


/**
 * Terrain event types.
 * @enum {string}
 */
const TerrainEventType = {
  PROVIDERS: 'terrain:providers'
};


/**
 * Terrain settings keys.
 * @enum {string}
 */
const TerrainSetting = {
  ACTIVE_TERRAIN: 'os.map.terrain.activeTerrainId'
};


/**
 * Supported terrain types.
 * @enum {string}
 */
const TerrainType = {
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
 * The active terrain provider.
 * @type {osx.map.TerrainProviderOptions|undefined}
 */
let activeProvider = undefined;


/**
 * If a terrain provider is available.
 * @return {boolean}
 */
const hasTerrain = () => providers.length > 0;


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
const addTerrainProvider = (options) => {
  if (isValidProvider(options)) {
    if (!options.name) {
      options.name = 'Unknown Terrain Provider';
    }

    if (!providers.some((p) => p.id === options.id)) {
      providers.push(options);
      os.dispatcher.dispatchEvent(TerrainEventType.PROVIDERS);

      // if the terrain provider was previously active, activate it now
      const activeId = Settings.getInstance().get(TerrainSetting.ACTIVE_TERRAIN);
      if (activeId && activeId === options.id) {
        setActiveTerrainProvider(options);
      }
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
const getTerrainProviders = () => providers;


/**
 * Get the active terrain provider.
 * @return {osx.map.TerrainProviderOptions|undefined}
 */
const getActiveTerrainProvider = () => {
  if (!activeProvider && providers.length) {
    // if the active terrain provider has not yet been set, use the last one added. this ensures the last provider
    // loaded from settings will be selected first.
    activeProvider = providers[providers.length - 1];
  }

  return activeProvider;
};


/**
 * Set the active terrain provider.
 * @param {osx.map.TerrainProviderOptions|string} provider The new provider.
 */
const setActiveTerrainProvider = (provider) => {
  let newProvider;

  if (typeof provider === 'string') {
    newProvider = providers.find((p) => p.id === provider);
  } else {
    newProvider = provider;
  }

  if (newProvider && newProvider !== activeProvider) {
    activeProvider = newProvider;
    Settings.getInstance().set(TerrainSetting.ACTIVE_TERRAIN, activeProvider.id);
  }
};


exports = {
  TerrainEventType,
  TerrainSetting,
  TerrainType,
  hasTerrain,
  addTerrainProvider,
  getTerrainProviders,
  getActiveTerrainProvider,
  setActiveTerrainProvider
};
