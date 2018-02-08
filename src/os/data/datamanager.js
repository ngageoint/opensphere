goog.provide('os.data.DataManager');

goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.DataProviderEvent');
goog.require('os.data.DescriptorEvent');
goog.require('os.data.DescriptorEventType');
goog.require('os.data.IDataDescriptor');
goog.require('os.data.IDataManager');
goog.require('os.data.IDataProvider');
goog.require('os.data.IUrlDescriptor');
goog.require('os.data.ProviderEntry');
goog.require('os.defines');
goog.require('os.ui.server.AbstractLoadingServer');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * The data manager provides methods for tracking and registering providers and descriptors.
 * @extends {goog.events.EventTarget}
 * @implements {os.data.IDataManager}
 * @constructor
 */
os.data.DataManager = function() {
  os.data.DataManager.base(this, 'constructor');

  /**
   * The logger
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.data.DataManager.LOGGER_;

  /**
   * @type {!Object<string, os.data.ProviderEntry>}
   * @private
   */
  this.providerTypes_ = {};

  /**
   * @type {!Object<string, function(new:os.data.IDataDescriptor)>}
   * @private
   */
  this.descriptorTypes_ = {};

  /**
   * @type {!os.structs.ITreeNode}
   * @private
   */
  this.providerRoot_ = new os.ui.slick.SlickTreeNode();

  /**
   * @type {!Object<string, !os.data.IDataDescriptor>}
   * @private
   */
  this.descriptors_ = {};

  /**
   * Debounces calls to persist when adding new descriptors to the tool.
   * @type {goog.async.Delay}
   * @private
   */
  this.persistDelay_ = new goog.async.Delay(this.persistDescriptors, 50, this);

  this.migrateDescriptors_();
};
goog.inherits(os.data.DataManager, goog.events.EventTarget);
goog.addSingletonGetter(os.data.DataManager);


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.data.DataManager.LOGGER_ = goog.log.getLogger('os.data.DataManager');


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.registerProviderType = function(entry) {
  if (entry.type in this.providerTypes_) {
    goog.log.warning(this.log,
        'The provider type "' + entry.type + '" has already been registered with the data manager!');
  } else {
    this.providerTypes_[entry.type] = entry;
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getProviderEntry = function(type) {
  return type && type in this.providerTypes_ ? this.providerTypes_[type] : null;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getProviderTypeByFile = function(file) {
  var best = null;
  var bestScore = 0;

  for (var type in this.providerTypes_) {
    var entry = this.providerTypes_[type];

    if (entry.fileDetection) {
      var score = entry.fileDetection(file);

      if (score > bestScore) {
        best = entry.type;
        bestScore = score;
      }
    }
  }

  return best;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getProviderTypeByClass = function(clazz) {
  for (var type in this.providerTypes_) {
    var entry = this.providerTypes_[type];

    if (entry.clazz === clazz) {
      return entry.type;
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.registerDescriptorType = function(type, clazz, opt_override) {
  type = type.toLowerCase();

  if (type in this.descriptorTypes_) {
    if (opt_override) {
      goog.log.warning(this.log, 'The descriptor type "' + type + '" is being overridden!');
    } else {
      goog.log.error(this.log, 'The descriptor type "' + type + '" already exists!');
      return;
    }
  }

  this.descriptorTypes_[type] = clazz;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.createProvider = function(type) {
  if (type) {
    type = type.toLowerCase();

    if (type in this.providerTypes_) {
      var dp = null;
      try {
        // check if the provider is a singleton
        dp = this.providerTypes_[type].clazz.getInstance();
      } catch (e) {
      }

      if (!dp) {
        dp = /** @type {os.data.IDataProvider} */ (new this.providerTypes_[type].clazz());
      }

      return dp;
    }

    goog.log.warning(this.log, 'No provider exists for type "' + type + '".');
  }
  return null;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.createDescriptor = function(type) {
  type = type.toLowerCase();

  if (type in this.descriptorTypes_) {
    return /** @type {os.data.IDataDescriptor} */ (new this.descriptorTypes_[type]());
  }

  // may not care if the descriptor doesn't exist, so don't log this by default
  goog.log.fine(this.log, 'No descriptor exists for type "' + type + '".');
  return null;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.updateDescriptor = function(oldDescriptor, newDescriptor) {
  if (oldDescriptor.getId() && newDescriptor.getId()) {
    // Remove previous aliases
    var aliases = oldDescriptor.getAliases();
    for (var i = 0, n = aliases.length; i < n; i++) {
      delete this.descriptors_[aliases[i]];
    }

    // Add the new aliases.
    aliases = newDescriptor.getAliases();
    for (var i = 0, n = aliases.length; i < n; i++) {
      this.descriptors_[aliases[i]] = newDescriptor;
    }

    this.dispatchEvent(new os.data.DescriptorEvent(
        os.data.DescriptorEventType.UPDATE_DESCRIPTOR, oldDescriptor, newDescriptor));
  } else {
    goog.log.error(this.log, 'Could not update the descriptor because its ID was empty or null');
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.addDescriptor = function(descriptor) {
  if (descriptor.getId()) {
    var aliases = descriptor.getAliases();

    for (var i = 0, n = aliases.length; i < n; i++) {
      this.descriptors_[aliases[i]] = descriptor;
    }

    this.dispatchEvent(new os.data.DescriptorEvent(os.data.DescriptorEventType.ADD_DESCRIPTOR, descriptor));
    this.persistDelay_.start();
  } else {
    goog.log.error(this.log, 'Could not add the descriptor because its ID was empty or null');
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.removeDescriptor = function(descriptor) {
  if (descriptor.getId()) {
    var aliases = descriptor.getAliases();

    for (var i = 0, n = aliases.length; i < n; i++) {
      delete this.descriptors_[aliases[i]];
    }

    this.dispatchEvent(new os.data.DescriptorEvent(os.data.DescriptorEventType.REMOVE_DESCRIPTOR, descriptor));
    this.persistDelay_.start();
  } else {
    goog.log.error(this.log, 'Could not remove the descriptor because its ID was empty or null');
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getDescriptor = function(id) {
  if (id in this.descriptors_) {
    return this.descriptors_[id];
  }

  return null;
};


/**
 * Gets a data descriptor by URL.
 * @param {string} url The descriptor URL to match
 * @return {?os.data.IDataDescriptor} The descriptor or <code>null</code> if none was found
 */
os.data.DataManager.prototype.getDescriptorByUrl = function(url) {
  var descriptors = this.getDescriptors();
  for (var i = 0, ii = descriptors.length; i < ii; i++) {
    if (descriptors[i].matchesURL(url)) {
      return descriptors[i];
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getDescriptors = function(opt_prefix) {
  var list = [];
  for (var key in this.descriptors_) {
    if (!opt_prefix || key.indexOf(opt_prefix) === 0) {
      var item = this.descriptors_[key];

      if (list.indexOf(item) === -1) {
        list.push(item);
      }
    }
  }

  return list;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getProviderRoot = function() {
  return this.providerRoot_;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.updateFromSettings = function(settings) {
  var sets = ['providers', 'userProviders'];
  for (var s = 0, ss = sets.length; s < ss; s++) {
    var set = /** @type {Object} */ (settings.get([sets[s]]));

    for (var id in set) {
      var item = /** @type {Object} */ (set[id]);

      // make sure the item is an object, in case Closure adds a UID key to the set
      if (typeof item == 'object') {
        item['id'] = id;
        var on = true;

        if ('enabled' in item) {
          if (goog.isString(item['enabled'])) {
            on = item['enabled'].toLowerCase() == 'true';
          } else {
            on = item['enabled'];
          }
        }

        var dp = this.createProvider(item['type']);
        if (dp) {
          dp.setId(id);
          dp.configure(item);
          dp.setEnabled(on);
          dp.setEditable(s > 0);

          this.addProvider(dp);

          if (dp.getEnabled()) {
            dp.load();
          }
        }
      }
    }
  }

  // listen for changes and persist them back to settings
  for (var key in os.data.DescriptorEventType) {
    os.dispatcher.listen(os.data.DescriptorEventType[key], this.persistDescriptors, false, this);
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.addProvider = function(dp) {
  if (this.getProvider(dp.getId())) {
    throw new Error('A provider with the ID "' + dp.getId() +
        '" already exists! Modify that one rather than replacing it.');
  }

  this.providerRoot_.addChild(dp);
  dp.listen(goog.events.EventType.PROPERTYCHANGE, this.onProviderChange, false, this);

  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.ADD_PROVIDER, dp));
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.removeProvider = function(id) {
  var provider = this.getProvider(id);
  if (provider) {
    provider.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onProviderChange, false, this);
    this.providerRoot_.removeChild(provider);

    this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.REMOVE_PROVIDER, provider));
    provider.dispose();
  }
};


/**
 * Handle property change events fired by data providers.
 * @param {!os.events.PropertyChangeEvent} event
 * @protected
 */
os.data.DataManager.prototype.onProviderChange = function(event) {
  var p = event.getProperty();
  var provider = /** @type {os.data.ILoadingProvider} */ (event.target);

  if (p == 'loading' && !provider.isLoading()) {
    // alert listeners that a server failed to load
    this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, provider));
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.setProviderEnabled = function(id, enabled) {
  var provider = this.getProvider(id);
  if (provider) {
    provider.setEnabled(enabled);
    this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.EDIT_PROVIDER, provider));
  }
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getProvider = function(id, opt_url) {
  // Get the base id for the provider
  id = id.replace(/#.*/, '');
  opt_url = opt_url ? opt_url.replace(/#.*/, '') : null;
  var list = this.providerRoot_.getChildren();
  var provider = null;

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].getId() == id ||
          (opt_url && list[i] instanceof os.ui.server.AbstractLoadingServer && list[i].getUrl() == opt_url)) {
        provider = /** @type {os.data.IDataProvider} */ (list[i]);
        break;
      }
    }
  }

  return provider;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getProviderByLabel = function(label) {
  var list = this.providerRoot_.getChildren();
  var provider = null;

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].getLabel() == label) {
        provider = /** @type {os.data.IDataProvider} */ (list[i]);
        break;
      }
    }
  }

  return provider;
};


/**
 * Migrate descriptors from direct reference of local storage to settings, which may be server or local persistence
 * @private
 */
os.data.DataManager.prototype.migrateDescriptors_ = function() {
  var str = window.localStorage.getItem(this.getDescriptorKey());
  if (str) {
    var list = /** @type {Array} */ (JSON.parse(str));
    os.settings.set(this.getDescriptorKey(), list);
    window.localStorage.removeItem(this.getDescriptorKey());
  }
};


/**
 * If any enabled provider is in the error state.
 * @return {boolean}
 */
os.data.DataManager.prototype.hasError = function() {
  var providers = /** @type {Array<os.data.IDataProvider>} */ (this.providerRoot_.getChildren());
  if (providers) {
    return goog.array.some(providers, function(p) {
      return p.getEnabled() && p.getError();
    });
  }

  return false;
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.persistDescriptors = function() {
  var list = [];
  var aliasesSeen = {};
  var now = Date.now();
  var threshold = now - 30 * 24 * 60 * 60 * 1000;

  for (var key in this.descriptors_) {
    if (!(key in aliasesSeen)) {
      var d = this.descriptors_[key];
      if (!d) {
        // descriptor missing, carry on
        continue;
      }

      // mark all of these aliases as covered so we don't duplicate the descriptor
      var aliases = d.getAliases();
      for (var i = 0, n = aliases.length; i < n; i++) {
        aliasesSeen[aliases[i]] = true;
      }

      if (os.implements(d, os.data.IUrlDescriptor.ID)) {
        var url = /** @type {os.data.IUrlDescriptor} */ (d).getUrl();
        if (!url || (os.file.isLocal(url) && !os.file.FileStorage.getInstance().isPersistent())) {
          // skip the descriptor if the URL is missing, or if it's a local URL and we can't persist the file
          continue;
        }
      }

      // persist the descriptor if it's local to the application, or it was active within the threshold
      if (d.isLocal() || d.getLastActive() > threshold) {
        list.push(d.persist());
      }
    }
  }

  os.settings.set(this.getDescriptorKey(), list);
};


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.restoreDescriptors = function() {
  var list = os.settings.get(this.getDescriptorKey());

  if (list) {
    var now = Date.now();

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        try {
          var d = this.createDescriptor(list[i]['dType']);

          if (d) {
            d.restore(list[i]);

            if (d.getId() && (isNaN(d.getDeleteTime()) || d.getDeleteTime() > now)) {
              this.addDescriptor(d);
            }
          }
        } catch (e) {
          goog.log.warning(this.log, 'There was an error loading data descriptor #' + i);
        }
      }
    }
  }
};


/**
 * @type {string}
 * @const
 * @private
 */
os.data.DataManager.DESCRIPTOR_KEY_ = os.NAMESPACE + '.descriptors';


/**
 * @inheritDoc
 */
os.data.DataManager.prototype.getDescriptorKey = function() {
  return os.data.DataManager.DESCRIPTOR_KEY_;
};
