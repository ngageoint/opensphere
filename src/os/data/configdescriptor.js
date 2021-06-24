goog.module('os.data.ConfigDescriptor');
goog.module.declareLegacyNamespace();

const googObject = goog.require('goog.object');
const osArray = goog.require('os.array');
const LayerSyncDescriptor = goog.require('os.data.LayerSyncDescriptor');
const ImportProcess = goog.require('os.im.ImportProcess');
const osImplements = goog.require('os.implements');
const LayerType = goog.require('os.layer.LayerType');
const Icons = goog.require('os.ui.Icons');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');

const IReimport = goog.requireType('os.data.IReimport');


/**
 * @implements {IReimport}
 */
class ConfigDescriptor extends LayerSyncDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.descriptorType = ConfigDescriptor.ID;

    /**
     * The original layer configuration(s) for the descriptor.
     * @type {!(Array<Object>|Object)}
     * @protected
     */
    this.baseConfig = {};

    /**
     * Cached icons from the base config.
     * @type {?string}
     * @protected
     */
    this.icons = null;
  }

  /**
   * @inheritDoc
   */
  getAliases() {
    var aliases = [this.getId()];
    var ids = /** @type {Array<string>|string} */ (getAll(this.baseConfig, 'id'));
    if (ids) {
      if (Array.isArray(ids)) {
        aliases = aliases.concat(ids);
      } else {
        aliases.push(ids);
      }
    }

    return aliases;
  }

  /**
   * @inheritDoc
   */
  getId() {
    // if an id is explicitly set on the descriptor, use that. otherwise determine one from the configs.
    var id = super.getId();
    if (!id) {
      var ids = /** @type {string} */ (getAll(this.baseConfig, 'id'));

      if (Array.isArray(ids)) {
        if (ids.length > 1) {
          var done = false;
          for (var x = 0, xx = ids[0].length; x < xx && !done; x++) {
            var char = ids[0].charAt(x);
            for (var i = 1, ii = ids.length; i < ii && !done; i++) {
              if (ids[i].charAt(x) !== char) {
                done = true;
              }
            }
          }

          ids = ids[0].substring(0, x - 1);
        } else if (ids.length) {
          ids = ids[0];
        }
      }

      id = ids;
    }

    return id;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return (
      /** @type {string} */ (this.getFirst('title')) || super.getTitle()
    );
  }

  /**
   * @inheritDoc
   */
  getType() {
    var types = /** @type {Array<string>|string} */ (getAll(this.baseConfig, 'layerType'));

    if (Array.isArray(types)) {
      if (types.indexOf(LayerType.TILES) > -1 &&
          types.indexOf(LayerType.FEATURES) > -1) {
        types = LayerType.GROUPS;
      } else {
        types = types[0];
      }
    }

    return types || super.getType();
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return /** @type {string} */ (this.getFirst('provider') || super.getProvider());
  }

  /**
   * @inheritDoc
   */
  getDescription() {
    var val = /** @type {Array<string>|string} */ (getAll(this.baseConfig, 'description'));
    val = Array.isArray(val) ? val.join('\n\n') : val;
    return val || super.getDescription();
  }

  /**
   * @inheritDoc
   */
  getTags() {
    var tagSets = /** @type {Array<string>} */ (getAll(this.baseConfig, 'tags'));
    var tags = null;

    if (Array.isArray(tagSets)) {
      tags = tagSets.reduce(function(all, set) {
        return all.concat(set);
      }, []);
    } else {
      tags = tagSets;
    }

    tags = tags || super.getTags();
    if (tags) {
      osArray.removeDuplicates(tags);
    }
    return tags;
  }

  /**
   * @inheritDoc
   */
  getDescriptorType() {
    return /** @type {string} */ (this.getFirst('descriptorType') || super.getDescriptorType());
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    if (this.icons == null) {
      var icons = /** @type {Array<string>|string} */ (getAll(this.baseConfig, 'icons', ''));
      if (Array.isArray(icons)) {
        icons = icons.join('');
      }

      if (!icons) {
        // icons were not defined in configs, so determine them based on other config values
        if (Array.isArray(this.baseConfig)) {
          icons = this.baseConfig.reduce(reduceConfigIcons, '');
        } else {
          icons = reduceConfigIcons('', this.baseConfig);
        }

        icons = os.string.removeDuplicates(icons, Icons.TILES);
        icons = os.string.removeDuplicates(icons, Icons.FEATURES);
        icons = os.string.removeDuplicates(icons, Icons.TIME);
      }

      this.icons = icons || super.getIcons() || '';
    }

    return this.icons;
  }

  /**
   * @inheritDoc
   */
  getSearchType() {
    var type = this.getType();

    if (type) {
      type = type.replace(/s$/, '').toLowerCase();
    }

    return type;
  }

  /**
   * @param {string} key
   * @return {*}
   */
  getFirst(key) {
    var val = getAll(this.baseConfig, key);
    return Array.isArray(val) && val.length ? val[0] : val;
  }

  /**
   * Get the base layer config(s) for the descriptor.
   * @return {!(Array<Object>|Object)} The layer config(s).
   */
  getBaseConfig() {
    return this.baseConfig;
  }

  /**
   * Set the base layer config(s) for the descriptor.
   * @param {Array<Object>|Object} config The layer config(s).
   */
  setBaseConfig(config) {
    this.baseConfig = config || {};

    // update icons on next call to getIcons
    this.icons = null;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    return this.getBaseConfig();
  }

  /**
   * @inheritDoc
   */
  matchesURL(url) {
    return matchesURL(this.baseConfig, url);
  }

  /**
   * @inheritDoc
   */
  canReimport() {
    var importUrl = this.getFirst('importUrl');
    return !!importUrl;
  }

  /**
   * @inheritDoc
   */
  reimport() {
    var config = this.getBaseConfig();
    var evt = new ImportEvent(ImportEventType.URL,
        /** @type {string} */ (this.getFirst('importUrl') || this.getFirst('url')));

    var process = new ImportProcess();
    process.setEvent(evt);
    process.setConfig(config);
    process.begin();
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return (
      /** @type {string} */ (this.getFirst('nodeUi')) || super.getNodeUI()
    );
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    if (!opt_obj) {
      opt_obj = {};
    }

    opt_obj['base'] = this.persistBase_(this.baseConfig);
    return super.persist(opt_obj);
  }

  /**
   * @param {Array<Object<string, *>>|Object<string, *>} obj
   * @return {Array<Object<string, *>>|Object<string, *>}
   * @private
   */
  persistBase_(obj) {
    if (Array.isArray(obj)) {
      return obj.map(this.persistBase_, this);
    }
    // we are going to shallow-copy everything that is not an instance object
    var base = {};
    for (var key in obj) {
      var thing = obj[key];

      if (goog.typeOf(thing) !== 'object' || thing.constructor === Object) {
        base[key] = thing;
      }
    }

    return base;
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    this.baseConfig = conf['base'];
    super.restore(conf);

    var delayUpdate = googObject.getValueByKeys(conf, 'base', 'delayUpdateActive');
    if (!delayUpdate) {
      // if that config flag is set, don't call this here, the provider will call it once it loads and updates the
      // descriptor
      this.updateActiveFromTemp();
    }
  }
}
osImplements(ConfigDescriptor, 'os.data.IReimport');

/**
 * @param {Array|Object} objOrArr The config object/array.
 * @param {string} key The config key.
 * @param {*=} opt_default The default value.
 * @return {*}
 */
const getAll = (objOrArr, key, opt_default) => {
  var defaultValue = opt_default != null ? opt_default : null;
  if (Array.isArray(objOrArr)) {
    return objOrArr.map(function(item) {
      return getAll(item, key, defaultValue);
    });
  } else if (objOrArr) {
    return key in objOrArr ? objOrArr[key] : defaultValue;
  }
  return defaultValue;
};

/**
 * @param {Array|Object} objOrArr
 * @param {string} url
 * @return {boolean}
 * @private
 */
const matchesURL = (objOrArr, url) => {
  if (Array.isArray(objOrArr)) {
    return objOrArr.reduce(function(prev, curr) {
      if (prev) {
        return prev;
      }

      return matchesURL(curr, url);
    }, false);
  } else if (url) {
    var myUrl = /** @type {string} */ (getAll(objOrArr, 'url'));
    if (url == myUrl) {
      return true;
    }

    var myUrls = /** @type {Array<string>} */ (getAll(objOrArr, 'urls'));
    if (Array.isArray(myUrls) && myUrls.indexOf(url) > -1) {
      return true;
    }
  }

  return false;
};

/**
 * Reduce function to determine icons from layer configs.
 * @param {string} icons The accumulated icons.
 * @param {Object} config The layer config.
 * @return {string} The icons for the config.
 */
const reduceConfigIcons = (icons, config) => {
  if (config) {
    var layerType = config['layerType'];
    if (layerType === LayerType.TILES || layerType === LayerType.GROUPS) {
      icons += Icons.TILES;
    }
    if (layerType === LayerType.FEATURES || layerType === LayerType.GROUPS) {
      icons += Icons.FEATURES;
    }

    if (config['animate']) {
      icons += Icons.TIME;
    }
  }

  return icons;
};

/**
 * @type {string}
 * @const
 */
ConfigDescriptor.ID = 'config';


exports = ConfigDescriptor;
