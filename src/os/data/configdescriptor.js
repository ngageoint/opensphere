goog.provide('os.data.ConfigDescriptor');

goog.require('goog.object');
goog.require('os.array');
goog.require('os.command.LayerAdd');
goog.require('os.data');
goog.require('os.data.IReimport');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.im.ImportProcess');
goog.require('os.implements');
goog.require('os.layer.LayerType');
goog.require('os.ui.Icons');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');



/**
 * @extends {os.data.LayerSyncDescriptor}
 * @implements {os.data.IReimport}
 * @constructor
 */
os.data.ConfigDescriptor = function() {
  os.data.ConfigDescriptor.base(this, 'constructor');
  this.descriptorType = os.data.ConfigDescriptor.ID;

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
};
goog.inherits(os.data.ConfigDescriptor, os.data.LayerSyncDescriptor);
os.implements(os.data.ConfigDescriptor, 'os.data.IReimport');


/**
 * @type {string}
 * @const
 */
os.data.ConfigDescriptor.ID = 'config';


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getAliases = function() {
  var aliases = [this.getId()];
  var ids = /** @type {Array<string>|string} */ (os.data.ConfigDescriptor.getAll_(this.baseConfig, 'id'));
  if (ids) {
    if (Array.isArray(ids)) {
      aliases = aliases.concat(ids);
    } else {
      aliases.push(ids);
    }
  }

  return aliases;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getId = function() {
  // if an id is explicitly set on the descriptor, use that. otherwise determine one from the configs.
  var id = os.data.ConfigDescriptor.base(this, 'getId');
  if (!id) {
    var ids = /** @type {string} */ (os.data.ConfigDescriptor.getAll_(this.baseConfig, 'id'));

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
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getTitle = function() {
  return /** @type {string} */ (this.getFirst('title')) || os.data.ConfigDescriptor.base(this, 'getTitle');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getType = function() {
  var types = /** @type {Array<string>|string} */ (os.data.ConfigDescriptor.getAll_(this.baseConfig, 'layerType'));

  if (Array.isArray(types)) {
    if (types.indexOf(os.layer.LayerType.TILES) > -1 &&
        types.indexOf(os.layer.LayerType.FEATURES) > -1) {
      types = os.layer.LayerType.GROUPS;
    } else {
      types = types[0];
    }
  }

  return types || os.data.ConfigDescriptor.base(this, 'getType');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getProvider = function() {
  return /** @type {string} */ (this.getFirst('provider') || os.data.ConfigDescriptor.base(this, 'getProvider'));
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getDescription = function() {
  var val = /** @type {Array<string>|string} */ (os.data.ConfigDescriptor.getAll_(this.baseConfig, 'description'));
  val = Array.isArray(val) ? val.join('\n\n') : val;
  return val || os.data.ConfigDescriptor.base(this, 'getDescription');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getTags = function() {
  var tagSets = /** @type {Array<string>} */ (os.data.ConfigDescriptor.getAll_(this.baseConfig, 'tags'));
  var tags = null;

  if (Array.isArray(tagSets)) {
    tags = tagSets.reduce(function(all, set) {
      return all.concat(set);
    }, []);
  } else {
    tags = tagSets;
  }

  tags = tags || os.data.ConfigDescriptor.base(this, 'getTags');
  if (tags) {
    os.array.removeDuplicates(tags);
  }
  return tags;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getDescriptorType = function() {
  return /** @type {string} */ (this.getFirst('descriptorType') ||
      os.data.ConfigDescriptor.base(this, 'getDescriptorType'));
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getIcons = function() {
  if (this.icons == null) {
    var icons = /** @type {Array<string>|string} */ (os.data.ConfigDescriptor.getAll_(this.baseConfig, 'icons', ''));
    if (Array.isArray(icons)) {
      icons = icons.join('');
    }

    if (!icons) {
      // icons were not defined in configs, so determine them based on other config values
      if (Array.isArray(this.baseConfig)) {
        icons = this.baseConfig.reduce(os.data.ConfigDescriptor.reduceConfigIcons_, '');
      } else {
        icons = os.data.ConfigDescriptor.reduceConfigIcons_('', this.baseConfig);
      }

      icons = os.string.removeDuplicates(icons, os.ui.Icons.TILES);
      icons = os.string.removeDuplicates(icons, os.ui.Icons.FEATURES);
      icons = os.string.removeDuplicates(icons, os.ui.Icons.TIME);
    }

    this.icons = icons || os.data.ConfigDescriptor.base(this, 'getIcons') || '';
  }

  return this.icons;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getSearchType = function() {
  var type = this.getType();

  if (type) {
    type = type.replace(/s$/, '').toLowerCase();
  }

  return type;
};


/**
 * @param {string} key
 * @return {*}
 */
os.data.ConfigDescriptor.prototype.getFirst = function(key) {
  var val = os.data.ConfigDescriptor.getAll_(this.baseConfig, key);
  return Array.isArray(val) && val.length ? val[0] : val;
};


/**
 * @param {Array|Object} objOrArr The config object/array.
 * @param {string} key The config key.
 * @param {*=} opt_default The default value.
 * @return {*}
 * @private
 */
os.data.ConfigDescriptor.getAll_ = function(objOrArr, key, opt_default) {
  var defaultValue = opt_default != null ? opt_default : null;
  if (Array.isArray(objOrArr)) {
    return objOrArr.map(function(item) {
      return os.data.ConfigDescriptor.getAll_(item, key, defaultValue);
    });
  } else if (objOrArr) {
    return key in objOrArr ? objOrArr[key] : defaultValue;
  }
  return defaultValue;
};


/**
 * Get the base layer config(s) for the descriptor.
 * @return {!(Array<Object>|Object)} The layer config(s).
 */
os.data.ConfigDescriptor.prototype.getBaseConfig = function() {
  return this.baseConfig;
};


/**
 * Set the base layer config(s) for the descriptor.
 * @param {Array<Object>|Object} config The layer config(s).
 */
os.data.ConfigDescriptor.prototype.setBaseConfig = function(config) {
  this.baseConfig = config || {};

  // update icons on next call to getIcons
  this.icons = null;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getLayerOptions = function() {
  return this.getBaseConfig();
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.matchesURL = function(url) {
  return os.data.ConfigDescriptor.matchesURL_(this.baseConfig, url);
};


/**
 * @param {Array|Object} objOrArr
 * @param {string} url
 * @return {boolean}
 * @private
 */
os.data.ConfigDescriptor.matchesURL_ = function(objOrArr, url) {
  if (Array.isArray(objOrArr)) {
    return objOrArr.reduce(function(prev, curr) {
      if (prev) {
        return prev;
      }

      return os.data.ConfigDescriptor.matchesURL_(curr, url);
    }, false);
  } else if (url) {
    var myUrl = /** @type {string} */ (os.data.ConfigDescriptor.getAll_(objOrArr, 'url'));
    if (url == myUrl) {
      return true;
    }

    var myUrls = /** @type {Array<string>} */ (os.data.ConfigDescriptor.getAll_(objOrArr, 'urls'));
    if (Array.isArray(myUrls) && myUrls.indexOf(url) > -1) {
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.canReimport = function() {
  var importUrl = this.getFirst('importUrl');
  return !!importUrl;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.reimport = function() {
  var config = this.getBaseConfig();
  var evt = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL,
      /** @type {string} */ (this.getFirst('importUrl') || this.getFirst('url')));

  var process = new os.im.ImportProcess();
  process.setEvent(evt);
  process.setConfig(config);
  process.begin();
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getNodeUI = function() {
  return /** @type {string} */ (this.getFirst('nodeUi')) || os.data.ConfigDescriptor.base(this, 'getNodeUI');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['base'] = this.persistBase_(this.baseConfig);
  return os.data.ConfigDescriptor.base(this, 'persist', opt_obj);
};


/**
 * @param {Array<Object<string, *>>|Object<string, *>} obj
 * @return {Array<Object<string, *>>|Object<string, *>}
 * @private
 */
os.data.ConfigDescriptor.prototype.persistBase_ = function(obj) {
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
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.restore = function(conf) {
  this.baseConfig = conf['base'];
  os.data.ConfigDescriptor.base(this, 'restore', conf);

  var delayUpdate = goog.object.getValueByKeys(conf, 'base', 'delayUpdateActive');
  if (!delayUpdate) {
    // if that config flag is set, don't call this here, the provider will call it once it loads and updates the
    // descriptor
    this.updateActiveFromTemp();
  }
};


/**
 * Reduce function to determine icons from layer configs.
 * @param {string} icons The accumulated icons.
 * @param {Object} config The layer config.
 * @return {string} The icons for the config.
 */
os.data.ConfigDescriptor.reduceConfigIcons_ = function(icons, config) {
  if (config) {
    var layerType = config['layerType'];
    if (layerType === os.layer.LayerType.TILES || layerType === os.layer.LayerType.GROUPS) {
      icons += os.ui.Icons.TILES;
    }
    if (layerType === os.layer.LayerType.FEATURES || layerType === os.layer.LayerType.GROUPS) {
      icons += os.ui.Icons.FEATURES;
    }

    if (config['animate']) {
      icons += os.ui.Icons.TIME;
    }
  }

  return icons;
};
