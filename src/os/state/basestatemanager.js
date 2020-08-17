goog.provide('os.state.BaseStateManager');
goog.provide('os.state.BaseStateManager.EventType');
goog.provide('os.state.Versions');

goog.require('goog.async.Deferred');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.ui.state');
goog.require('os.ui.state.StateImportUI');
goog.require('os.ui.state.stateExportDirective');
goog.require('os.ui.window');


/**
 * Global state manager reference. Set this in each application with the app-specific manager reference.
 * @type {os.state.BaseStateManager}
 */
os.stateManager = null;



/**
 * Base state manager. Applications should extend this to fill in the abstract methods.
 *
 * @abstract
 * @extends {goog.events.EventTarget}
 * @constructor
 * @template T,S
 */
os.state.BaseStateManager = function() {
  os.state.BaseStateManager.base(this, 'constructor');

  /**
   * Content type to use when saving state files.
   * @type {string}
   * @protected
   */
  this.contentType = 'text/plain';

  /**
   * @type {Object.<string, !function(new:os.IPersistable)>}
   * @private
   */
  this.persistableMap_ = {};

  /**
   * @type {Object.<string, Object.<string, function(new:os.state.IState)>>}
   * @protected
   */
  this.versions = {};

  /**
   * The export version used by the application.
   * @type {string}
   * @private
   */
  this.version_ = '';

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.state.BaseStateManager.LOGGER_;
};
goog.inherits(os.state.BaseStateManager, goog.events.EventTarget);
goog.addSingletonGetter(os.state.BaseStateManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.BaseStateManager.LOGGER_ = goog.log.getLogger('os.state.BaseStateManager');


/**
 * State file versions supported by the application
 * @enum {string}
 * @const
 */
os.state.Versions = {
  V2: 'v2',
  V3: 'v3',
  V4: 'v4'
};


/**
 * Event types
 * @enum {string}
 */
os.state.BaseStateManager.EventType = {
  CLEAR: 'clear',
  DELETE: 'delete',
  LOADED: 'loaded'
};


/**
 * Sets the state export version used by the application.
 *
 * @param {string} version The state version string
 */
os.state.BaseStateManager.prototype.setVersion = function(version) {
  this.version_ = version;
};


/**
 * Gets the version of the state manager.
 *
 * @return {string}
 * @protected
 */
os.state.BaseStateManager.prototype.getVersion = function() {
  return this.version_;
};


/**
 * Registers a persistable object for use by states.
 *
 * @param {string} key The object key
 * @param {!function(new:os.IPersistable)} clazz The persistable class
 */
os.state.BaseStateManager.prototype.registerPersistable = function(key, clazz) {
  if (!(key in this.persistableMap_)) {
    this.persistableMap_[key] = clazz;
  } else {
    goog.log.error(this.log, 'Peristance class for ' + key + ' already registered!');
  }
};


/**
 * Gets an instance of a registered {@link os.IPersistable} class.
 *
 * @param {string} key The object key
 * @return {os.IPersistable}
 * @suppress {checkTypes} To allow the catch() failover to exist
 */
os.state.BaseStateManager.prototype.getPersistable = function(key) {
  var instance = null;
  if (this.isPersistable(key)) { // check for nulls, etc
    var Clazz = this.persistableMap_[key];
    try {
      instance = new Clazz();
    } catch (e) {
      var args = [this.log, `Registered persistance class for "${key}"`];
      var remove = false;

      // a non-constructable got into the User's state configs, e.g. an arrow function
      if (typeof Clazz != 'function') {
        remove = true;
        args[1] += ' could not be constructed.';
      } else {
        args[1] += ' is non-constructable. Tried call()...';
        instance = Clazz();
        if (!instance) {
          remove = true;
          args[1] += ' FAILED';
        }
      }

      if (remove) {
        // log why the persistableMap entry is being removed
        args.push(e);
        goog.log.error.apply(undefined, args);

        // cleanup to prevent logs from being hit with repeats of the same thing
        delete this.persistableMap_[key];
        goog.log.error(this.log, `Removed key "${key}" from registered persistance classes. Details above.`);
      } else {
        // recoverable; warn that the persistableMap is getting populated improperly
        goog.log.warning.apply(undefined, args);
      }
    }
  }

  return instance;
};


/**
 * Return true if there is a registered {@link os.IPersistable} class for this key
 *
 * @param {string} key The object key
 * @return {boolean}
 */
os.state.BaseStateManager.prototype.isPersistable = function(key) {
  // TODO swap to this simple return. Using the more complicated version for logging purposes
  // return (this.persistableMap_[key] && this.persistableMap_.hasOwnProperty(key));
  var persistable = false;

  if (key in this.persistableMap_) {
    // filter out null-ed map entries and object-level properties (e.g. toString)
    persistable = (this.persistableMap_[key] && this.persistableMap_.hasOwnProperty(key));
    if (!persistable) {
      delete this.persistableMap_[key];
      goog.log.error(
          this.log,
          `Removed key "${key}" from registered persistance classes. Null value or inherited property.`,
          new Error(`m[${key}] is not a constructor`));
    }
  }
  return persistable;
};


/**
 * Adds a state implementation to the manager.
 *
 * @param {string} version The state version
 * @param {function(new:os.state.IState)} clazz The state class
 * @param {string=} opt_type The state type
 */
os.state.BaseStateManager.prototype.addStateImplementation = function(version, clazz, opt_type) {
  if (!version) {
    throw new Error('version cannot be empty or null!');
  }

  if (!clazz) {
    throw new Error('clazz cannot be empty or null!');
  }

  try {
    if (!(version in this.versions)) {
      this.versions[version] = {};
    }

    var test = new clazz();
    if (test) {
      var tag = opt_type || test.toString();
      if (tag in this.versions[version]) {
        goog.log.warning(this.log, 'Replacing state implementation in version ' + version +
            ' for tag "' + tag + '".');
      }

      this.versions[version][tag] = clazz;
    }
  } catch (e) {
    throw new Error('clazz must be a state constructor!');
  }
};


/**
 * Deactivates all states in the application.
 */
os.state.BaseStateManager.prototype.clearStates = function() {
  // applications should extend this to actually do something, assuming they can save locally
};


/**
 * Deletes all local states
 */
os.state.BaseStateManager.prototype.deleteStates = function() {
  // applications should extend this to actually do something, assuming they can save locally
};


/**
 * Get all available states.
 *
 * @param {boolean=} opt_allVersions Whether to get all versions.
 * @return {!Array.<!os.state.IState>} The states
 */
os.state.BaseStateManager.prototype.getAvailable = function(opt_allVersions) {
  var list = [];
  var enabledStates = /** @type {Object<string, boolean>} */ (os.settings.get('ex.enabledStates', {}));
  var s;
  var pushFn = function(statez) {
    for (var tag in statez) {
      s = new statez[tag]();
      if (enabledStates[os.state.stateToString(s)] !== false) {
        list.push(s);
      }
    }
  };

  if (!opt_allVersions) {
    if (this.version_ in this.versions) {
      var states = this.versions[this.version_];
      pushFn(states);
    }
  } else {
    for (var version in this.versions) {
      var states = this.versions[version];
      pushFn(states);
    }
  }

  list.sort(os.state.titleCompare);
  return list;
};


/**
 * Adds an imported state to the application and loads it.
 *
 * @param {!os.file.File} file The state file
 * @param {S} options The state save options
 */
os.state.BaseStateManager.prototype.addImportedState = function(file, options) {
  var url = file.getUrl();
  if (url && os.file.isLocal(url)) {
    // local file, so store it before finishing the import
    this.saveLocal(file, options);
  } else {
    // remote file, so just finish the import
    this.finishImport(file, options);
  }
};


/**
 * Checks if the provided state title is in use by the application.
 *
 * @param {string} title The title
 * @return {boolean} If the title has been used
 */
os.state.BaseStateManager.prototype.hasState = function(title) {
  return false;
};


/**
 * Finish importing a state to the application.
 *
 * @param {!os.file.File} file The stored file
 * @param {S} options The save options
 */
os.state.BaseStateManager.prototype.finishImport = function(file, options) {
  // applications should override this function so it does something
};


/**
 * Initiate the state export process.
 *
 * @param {string=} opt_method Optional string label for the persistence method to default to.
 */
os.state.BaseStateManager.prototype.startExport = function(opt_method) {
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

  var template = '<stateexport method="method"></stateexport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Saves the application state.
 *
 * @param {os.ex.IPersistenceMethod} method The persistence method
 * @param {string} title The title
 * @param {string=} opt_desc The description
 * @param {string=} opt_tags The tags
 * @param {Array.<!os.state.IState>=} opt_states The states to save
 */
os.state.BaseStateManager.prototype.saveStates = function(method, title, opt_desc, opt_tags, opt_states) {
  var obj = this.createStateObject(method, title, opt_desc, opt_tags);
  var options = this.createStateOptions(method, title, obj, opt_desc, opt_tags);

  if (!opt_states) {
    opt_states = this.getAvailable();
  }

  if (opt_states) {
    options.states = opt_states;

    var deferred = new goog.async.Deferred();
    for (var i = 0, n = opt_states.length; i < n; i++) {
      var state = opt_states[i];
      deferred.awaitDeferred(state.save(options));
    }

    deferred.addCallbacks(goog.partial(this.onSaveSuccess, options), this.onSaveError, this).callback();
  } else {
    this.onSaveError('No state types selected');
  }
};


/**
 * Handle state save success.
 *
 * @param {S} options The state save options
 * @protected
 */
os.state.BaseStateManager.prototype.onSaveSuccess = function(options) {
  var content = this.serializeContent(options);
  var stateFileName = this.getStateFileName(options);
  goog.asserts.assert(content != null, 'No state content to save!');
  goog.asserts.assert(stateFileName != null, 'No state file name!');

  var persistMethod = options.method;
  if (persistMethod) {
    persistMethod.save(stateFileName, content, options.contentType || this.contentType, options.title,
        options.description, options.tags);
  } else {
    // user chose to save to the application so store the file locally
    try {
      var file = new os.file.File();
      file.setFileName(stateFileName);
      file.setUrl(os.file.getLocalUrl(stateFileName));
      file.setContent(content);
      file.setContentType(this.contentType);

      os.file.FileStorage.getInstance().setUniqueFileName(file);

      if (!this.saveLocal(file, options)) {
        goog.log.error(this.log, 'Failed saving state: unable to save locally');
      }
    } catch (e) {
      goog.log.error(this.log, 'error saving state file to local storage: ' + e.message, e);
    }
  }
};


/**
 * Handle state save failure.
 *
 * @param {string} errorMsg The error message
 * @protected
 */
os.state.BaseStateManager.prototype.onSaveError = function(errorMsg) {
  goog.log.error(this.log, 'Failed saving state: ' + errorMsg);
};


/**
 * Removes components of a state file from the application.
 *
 * @param {string} id The base state id
 */
os.state.BaseStateManager.prototype.removeState = function(id) {
  var list = this.getAvailable(true);
  for (var i = 0, n = list.length; i < n; i++) {
    try {
      var state = list[i];
      state.remove(id);
    } catch (e) {
      goog.log.error(this.log, 'Could not remove ' + state.toString() + ': ' + e.message, e);
    }
  }
};


/**
 * Saves the state file locally in the application. Extending classes should implement this if supported.
 *
 * @param {!os.file.File} file The file to save
 * @param {S} options The save options
 * @return {boolean} If the operation is supported and succeeded
 */
os.state.BaseStateManager.prototype.saveLocal = function(file, options) {
  // always replace. if we got here the application should have done duplicate file detection already.
  var fs = os.file.FileStorage.getInstance();
  fs.storeFile(file, true).addCallbacks(goog.partial(this.finishImport, file, options), this.onFileError_, this);

  return true;
};


/**
 * Handler for file storage error.
 *
 * @param {*} error
 * @private
 */
os.state.BaseStateManager.prototype.onFileError_ = function(error) {
  if (typeof error === 'string') {
    goog.log.error(this.log, 'Unable to store state file locally: ' + error);
  } else {
    goog.log.error(this.log, 'Unable to store state file locally!');
  }
};


/**
 * Determine which parts of a state are supported by the application.
 *
 * @abstract
 * @param {T|string} obj The state
 * @return {!Array.<!os.state.IState>} Supported states
 */
os.state.BaseStateManager.prototype.analyze = function(obj) {};


/**
 * Creates the root state object.
 *
 * @abstract
 * @param {os.ex.IPersistenceMethod} method The persistence method
 * @param {string} title The title
 * @param {string=} opt_desc The description
 * @param {string=} opt_tags The tags
 * @return {T} The save options
 * @protected
 */
os.state.BaseStateManager.prototype.createStateObject = function(method, title, opt_desc, opt_tags) {};


/**
 * Creates state save options.
 *
 * @abstract
 * @param {os.ex.IPersistenceMethod} method The persistence method
 * @param {string} title The title
 * @param {T} obj The root state object
 * @param {string=} opt_desc The description
 * @param {string=} opt_tags The tags
 * @return {S} The save options
 * @protected
 */
os.state.BaseStateManager.prototype.createStateOptions = function(method, title, obj, opt_desc, opt_tags) {};


/**
 * Gets the state file name.
 *
 * @abstract
 * @param {S} options The state options
 * @return {?string} The file name
 */
os.state.BaseStateManager.prototype.getStateFileName = function(options) {};


/**
 * Load a state from a document.
 *
 * @abstract
 * @param {T|string} obj The state
 * @param {Array.<!os.state.IState>} states The states to load
 * @param {string} stateId The state's identifier
 * @param {?string=} opt_title The state's title
 */
os.state.BaseStateManager.prototype.loadState = function(obj, states, stateId, opt_title) {};


/**
 * Serializes the state file content to a string.
 *
 * @abstract
 * @param {S} options The state options
 * @return {?string} The serialized content
 */
os.state.BaseStateManager.prototype.serializeContent = function(options) {};
