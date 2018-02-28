goog.provide('os.data.ConfigDescriptor');

goog.require('goog.object');
goog.require('os.command.LayerAdd');
goog.require('os.data.IReimport');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.im.ImportProcess');
goog.require('os.implements');
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
   * @type {?Object<string, *>}
   * @protected
   */
  this.baseConfig = null;
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
os.data.ConfigDescriptor.prototype.getId = function() {
  return /** @type {string} */ (this.get('id')) || os.data.ConfigDescriptor.base(this, 'getId');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getTitle = function() {
  return /** @type {string} */ (this.get('title')) || os.data.ConfigDescriptor.base(this, 'getTitle');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getType = function() {
  return /** @type {string} */ (this.get('layerType')) || os.data.ConfigDescriptor.base(this, 'getType');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getProvider = function() {
  return /** @type {string} */ (this.get('provider')) || os.data.ConfigDescriptor.base(this, 'getProvider');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getDescription = function() {
  return /** @type {string} */ (this.get('description')) || os.data.ConfigDescriptor.base(this, 'getDescription');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getTags = function() {
  return /** @type {Array<string>} */ (this.get('tags')) || os.data.ConfigDescriptor.base(this, 'getTags');
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getDescriptorType = function() {
  return /** @type {string} */ (this.get('descriptorType')) || os.data.ConfigDescriptor.base(this, 'getDescriptorType');
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
 * @param {!string} key
 * @return {*}
 */
os.data.ConfigDescriptor.prototype.get = function(key) {
  return key in this.baseConfig ? this.baseConfig[key] : null;
};


/**
 * @return {!Object<string, *>}
 */
os.data.ConfigDescriptor.prototype.getBaseConfig = function() {
  return this.baseConfig || {};
};


/**
 * @param {Object<string, *>} config
 */
os.data.ConfigDescriptor.prototype.setBaseConfig = function(config) {
  this.baseConfig = config;
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
  if (url) {
    var myUrl = this.get('url');
    if (url == myUrl) {
      return true;
    }

    var myUrls = this.get('urls');
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
  var importUrl = this.getBaseConfig()['importUrl'];
  return !!importUrl;
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.reimport = function() {
  var config = this.getBaseConfig();
  var evt = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL,
      /** @type {string} */ (config['importUrl'] || config['url']));

  var process = new os.im.ImportProcess();
  process.setEvent(evt);
  process.setConfig(config);
  process.begin();
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.getNodeUI = function() {
  if (this.baseConfig && this.baseConfig['nodeUi']) {
    return /** @type {string} */ (this.baseConfig['nodeUi']);
  } else {
    return '<defaultlayernodeui></defaultlayernodeui>';
  }
};


/**
 * @inheritDoc
 */
os.data.ConfigDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  // we are going to shallow-copy everything that is not an instance object
  var base = {};
  for (var key in this.baseConfig) {
    var thing = this.baseConfig[key];

    if (goog.typeOf(thing) !== 'object' || thing.prototype === Object.prototype) {
      base[key] = thing;
    }
  }

  opt_obj['base'] = base;
  return os.data.ConfigDescriptor.base(this, 'persist', opt_obj);
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
