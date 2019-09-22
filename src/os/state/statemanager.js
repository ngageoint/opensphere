goog.provide('os.state.StateManager');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.array');
goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.file.FileStorage');
goog.require('os.state');
goog.require('os.state.StateDescriptor');
goog.require('os.state.XMLStateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v2.BaseFilter');
goog.require('os.state.v2.ExclusionArea');
goog.require('os.state.v2.Filter');
goog.require('os.state.v2.LayerState');
goog.require('os.state.v2.QueryArea');
goog.require('os.state.v2.QueryEntries');
goog.require('os.state.v2.TimeState');
goog.require('os.state.v2.ViewState');
goog.require('os.state.v3.LayerState');
goog.require('os.state.v4.LayerState');
goog.require('os.state.v4.QueryArea');
goog.require('os.state.v4.TimeState');
goog.require('os.state.v4.ViewState');
goog.require('os.ui.state.StateProvider');



/**
 * State manager.
 *
 * @extends {os.state.XMLStateManager}
 * @constructor
 */
os.state.StateManager = function() {
  os.state.StateManager.base(this, 'constructor');
  this.log = os.state.StateManager.LOGGER_;
  this.setVersion(os.state.Versions.V4);

  // register the base map provider type
  var dm = os.dataManager;
  dm.registerProviderType(new os.data.ProviderEntry(
      'state',
      os.ui.state.StateProvider,
      'State Files',
      'Contains all state files'));

  // register the state descriptor type
  dm.registerDescriptorType('state', os.state.StateDescriptor);

  // V1 is not supported

  // V2 states
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.ExclusionArea);
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.Filter);
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.LayerState);
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.QueryArea);
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.QueryEntries);
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.TimeState);
  this.addStateImplementation(os.state.Versions.V2, os.state.v2.ViewState);

  // V3 states
  this.addStateImplementation(os.state.Versions.V3, os.state.v2.ExclusionArea);
  this.addStateImplementation(os.state.Versions.V3, os.state.v2.Filter);
  this.addStateImplementation(os.state.Versions.V3, os.state.v3.LayerState);
  this.addStateImplementation(os.state.Versions.V3, os.state.v2.QueryArea);
  this.addStateImplementation(os.state.Versions.V3, os.state.v2.QueryEntries);
  this.addStateImplementation(os.state.Versions.V3, os.state.v2.TimeState);
  this.addStateImplementation(os.state.Versions.V3, os.state.v2.ViewState);

  // V4 states
  this.addStateImplementation(os.state.Versions.V4, os.state.v2.ExclusionArea);
  this.addStateImplementation(os.state.Versions.V4, os.state.v2.Filter);
  this.addStateImplementation(os.state.Versions.V4, os.state.v4.LayerState);
  this.addStateImplementation(os.state.Versions.V4, os.state.v4.QueryArea);
  this.addStateImplementation(os.state.Versions.V4, os.state.v2.QueryEntries);
  this.addStateImplementation(os.state.Versions.V4, os.state.v4.TimeState);
  this.addStateImplementation(os.state.Versions.V4, os.state.v4.ViewState);

  /**
   * A map that contains the load functions
   * @type {Object}
   * @private
   */
  this.functionMap_ = {};
  this.functionMap_[os.state.Versions.V2] = {
    loadFunctions: [os.state.v2.BaseFilter.preload],
    saveFunctions: []
  };
  this.functionMap_[os.state.Versions.V3] = {
    loadFunctions: [os.state.v2.BaseFilter.preload],
    saveFunctions: []
  };
  this.functionMap_[os.state.Versions.V4] = {
    loadFunctions: [os.state.v2.BaseFilter.preload],
    saveFunctions: []
  };
};
goog.inherits(os.state.StateManager, os.state.XMLStateManager);
goog.addSingletonGetter(os.state.StateManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.StateManager.LOGGER_ = goog.log.getLogger('os.state.StateManager');


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.clearStates = function() {
  var dataManager = os.dataManager;
  var list = dataManager.getDescriptors('state' + os.ui.data.BaseProvider.ID_DELIMITER);
  list.forEach(function(d) {
    d.setActive(false);
  });

  this.dispatchEvent(os.state.BaseStateManager.EventType.CLEAR);
};


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.deleteStates = function() {
  var dataManager = os.dataManager;
  var list = dataManager.getDescriptors('state' + os.ui.data.BaseProvider.ID_DELIMITER);
  os.state.deleteStates(list);
};


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.hasState = function(title) {
  var dm = os.dataManager;
  var descriptors = dm.getDescriptors();
  for (var i = 0, n = descriptors.length; i < n; i++) {
    if (descriptors[i].getTitle() == title) {
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.finishImport = function(file, options) {
  // first check if the descriptor already exists
  var dm = os.dataManager;
  var sp = os.ui.state.StateProvider.getInstance();
  var descriptor = null;
  var descriptors = dm.getDescriptors();
  for (var i = 0, n = descriptors.length; i < n; i++) {
    var url = file.getUrl();
    if (descriptors[i] instanceof os.state.StateDescriptor && url && descriptors[i].matchesURL(url)) {
      // found an existing descriptor
      descriptor = /** @type {os.state.StateDescriptor} */ (descriptors[i]);
      break;
    }
  }

  // if not, create one
  if (!descriptor) {
    descriptor = os.state.StateDescriptor.createFromFile(file);
    descriptor.setId(sp.getUniqueId());
    descriptor.setProvider(sp.getLabel());
    descriptor.touchLastActive();
  }

  // update from the provided save options and add the descriptor to the application
  os.state.StateDescriptor.updateFromOptions(descriptor, options);
  dm.addDescriptor(descriptor);
  sp.addDescriptor(descriptor, options.load);
};


/**
 * This override attempts to populate some data into the state form based on the most recently activated state.
 *
 * @override
 */
os.state.StateManager.prototype.startExport = function(opt_method) {
  var scopeOptions = {
    'method': opt_method
  };

  var windowOptions = {
    'id': os.ui.state.EXPORT_WINDOW_ID,
    'label': 'Save State',
    'icon': 'fa fa-floppy-o',
    'x': 'center',
    'y': 'center',
    'width': '385',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };

  var descriptors = os.dataManager.getDescriptors();
  var stateDescriptors = [];

  descriptors.forEach(function(descriptor) {
    if (os.implements(descriptor, os.ui.state.IStateDescriptor.ID) && descriptor.isActive()) {
      var stateDescriptor = /** @type {os.ui.state.IStateDescriptor} */ (descriptor);
      stateDescriptors.push(stateDescriptor);
    }
  });

  if (stateDescriptors.length) {
    // sort by last active to get the most recently activated state and default in its details
    stateDescriptors.sort(function(a, b) {
      return goog.array.defaultCompare(a, b);
    });

    var descriptor = /** @type {os.ui.state.IStateDescriptor} */ (stateDescriptors[0]);
    scopeOptions['title'] = descriptor.getTitle();
    scopeOptions['method'] = descriptor.getDefaultPersister();
    scopeOptions['description'] = descriptor.getDescription();
    scopeOptions['tags'] = descriptor.getTags() ? descriptor.getTags().join(', ') : undefined;
  }

  var template = '<stateexport method="method" title="title"></stateexport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * @param  {Document|string} obj
 * @private
 */
os.state.StateManager.prototype.beforeLoad_ = function(obj) {
  if (obj && obj instanceof Document && goog.dom.getFirstElementChild(obj) instanceof Element) {
    var elem = goog.dom.getFirstElementChild(obj);
    var ns = elem.namespaceURI;

    // Extract the version from the state file.
    var versionKey;
    if (ns) {
      var index = ns.lastIndexOf('/');

      if (index < 0) {
        // Could not find a '/'
        versionKey = this.getVersion();
        var msg = 'Could not extract the version number from the xmlns: ' + ns + '. Using the default: ' + versionKey;
        goog.log.warning(os.state.StateManager.LOGGER_, msg);
      } else {
        versionKey = ns.substr(index + 1);
        if (!versionKey) {
          versionKey = this.getVersion();
          var msg = 'Could not extract the version number from the xmlns: ' + ns + '. Using the default: ' + versionKey;
          goog.log.warning(os.state.StateManager.LOGGER_, msg);
        }
      }
    } else {
      versionKey = this.getVersion();
    }

    // Need to inspect the object to find the version.
    var functions = this.functionMap_[versionKey];
    if (functions) {
      for (var i = 0, n = functions.loadFunctions.length; i < n; i++) {
        functions.loadFunctions[i](elem);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.analyze = function(obj) {
  this.beforeLoad_(obj);
  return os.state.StateManager.base(this, 'analyze', obj);
};


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.loadState = function(obj, states, stateId, opt_title) {
  this.beforeLoad_(obj);
  os.state.StateManager.base(this, 'loadState', obj, states, stateId, opt_title);
};


/**
 * Adds a load function that can be used to modify the state file before passing it to the state
 * implementations registered above.
 *
 * @param {function(!Element)} loadFunction
 * @param {string=} opt_versionKey The version of the states that the function supports.
 */
os.state.StateManager.prototype.addLoadFunction = function(loadFunction, opt_versionKey) {
  if (!opt_versionKey) {
    opt_versionKey = this.getVersion();
  }
  goog.array.insert(this.functionMap_[opt_versionKey].loadFunctions, loadFunction);
};


/**
 * Removes a load function
 *
 * @param {function(!Element)} loadFunction
 * @param {string=} opt_versionKey The version of the states that the function supports.
 */
os.state.StateManager.prototype.removeLoadFunction = function(loadFunction, opt_versionKey) {
  if (!opt_versionKey) {
    opt_versionKey = this.getVersion();
  }
  ol.array.remove(this.functionMap_[opt_versionKey].loadFunctions, loadFunction);
};


/**
 * Adds a save function that can be used to modify the state file after all the state implementations
 * have run.
 *
 * @param {function(!Element)} saveFunction
 * @param {string=} opt_versionKey The version of the states that the function supports.
 */
os.state.StateManager.prototype.addSaveFunction = function(saveFunction, opt_versionKey) {
  if (!opt_versionKey) {
    opt_versionKey = this.getVersion();
  }
  goog.array.insert(this.functionMap_[opt_versionKey].saveFunctions, saveFunction);
};


/**
 * Removes a save function
 *
 * @param {function(!Element)} saveFunction
 * @param {string=} opt_versionKey The version of the states that the function supports.
 */
os.state.StateManager.prototype.removeSaveFunction = function(saveFunction, opt_versionKey) {
  if (!opt_versionKey) {
    opt_versionKey = this.getVersion();
  }
  ol.array.remove(this.functionMap_[opt_versionKey].saveFunctions, saveFunction);
};


/**
 * @inheritDoc
 */
os.state.StateManager.prototype.onSaveSuccess = function(options) {
  var el = goog.dom.getFirstElementChild(options.doc);

  if (el) {
    var functions = this.functionMap_[this.getVersion()];
    for (var i = 0, n = functions.saveFunctions.length; i < n; i++) {
      functions.saveFunctions[i](el);
    }
  }

  os.state.StateManager.base(this, 'onSaveSuccess', options);
};
