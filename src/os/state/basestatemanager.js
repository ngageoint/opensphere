goog.module('os.state.BaseStateManager');

goog.require('os.ui.state.StateExportUI');
goog.require('os.ui.state.StateImportUI');

const {assert} = goog.require('goog.asserts');
const Deferred = goog.require('goog.async.Deferred');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const Settings = goog.require('os.config.Settings');
const {getLocalUrl, isLocal} = goog.require('os.file');
const OSFile = goog.require('os.file.File');
const FileStorage = goog.require('os.file.FileStorage');
const {stateToString, supportCompare, titleCompare} = goog.require('os.state');
const {EXPORT_WINDOW_ID} = goog.require('os.ui.state');
const osWindow = goog.require('os.ui.window');

const Logger = goog.requireType('goog.log.Logger');
const IPersistable = goog.requireType('os.IPersistable');
const IPersistenceMethod = goog.requireType('os.ex.IPersistenceMethod');
const IState = goog.requireType('os.state.IState');


/**
 * Base state manager. Applications should extend this to fill in the abstract methods.
 *
 * @abstract
 * @template T,S
 */
class BaseStateManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Content type to use when saving state files.
     * @type {string}
     * @protected
     */
    this.contentType = 'text/plain';

    /**
     * @type {Object<string, !function(new:IPersistable)>}
     * @private
     */
    this.persistableMap_ = {};

    /**
     * @type {Object<string, Object<string, function(new:IState)>>}
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
     * @type {Logger}
     * @protected
     */
    this.log = logger;
  }

  /**
   * Sets the state export version used by the application.
   *
   * @param {string} version The state version string
   */
  setVersion(version) {
    this.version_ = version;
  }

  /**
   * Gets the version of the state manager.
   *
   * @return {string}
   * @protected
   */
  getVersion() {
    return this.version_;
  }

  /**
   * Registers a persistable object for use by states.
   *
   * @param {string} key The object key
   * @param {!function(new:IPersistable)} clazz The persistable class
   */
  registerPersistable(key, clazz) {
    if (!(key in this.persistableMap_)) {
      this.persistableMap_[key] = clazz;
    } else {
      log.error(this.log, 'Persistence class for ' + key + ' already registered!');
    }
  }

  /**
   * Gets an instance of a registered {@link IPersistable} class.
   *
   * @param {string} key The object key
   * @return {IPersistable}
   */
  getPersistable(key) {
    var instance = null;
    if (this.isPersistable(key)) { // check for nulls, etc
      var Clazz = this.persistableMap_[key];
      try {
        instance = new Clazz();
      } catch (e) {
        var msg = `Registered persistence class for "${key}"`;

        // a non-constructable got into the User's state configs, e.g. an arrow function
        if (typeof Clazz != 'function') {
          msg += ' could not be constructed.';
        } else {
          msg += ' is non-constructable.';
        }

        // log why the persistableMap entry is being removed
        log.error(this.log, msg, e);

        // cleanup to prevent logs from being hit with repeats of the same thing
        delete this.persistableMap_[key];
        log.error(this.log, `Removed key "${key}" from registered persistence classes. Details above.`);
      }
    }

    return instance;
  }

  /**
   * Return true if there is a registered {@link IPersistable} class for this key
   *
   * @param {string} key The object key
   * @return {boolean}
   */
  isPersistable(key) {
    // TODO swap to this simple return. Using the more complicated version for logging purposes
    // return (this.persistableMap_[key] && this.persistableMap_.hasOwnProperty(key));
    var persistable = false;

    if (key in this.persistableMap_) {
      // filter out null-ed map entries and object-level properties (e.g. toString)
      persistable = (this.persistableMap_[key] && this.persistableMap_.hasOwnProperty(key));
      if (!persistable) {
        delete this.persistableMap_[key];
        log.error(
            this.log,
            `Removed key "${key}" from registered persistence classes. Null value or inherited property.`,
            new Error(`m[${key}] is not a constructor`));
      }
    }
    return persistable;
  }

  /**
   * Adds a state implementation to the manager.
   *
   * @param {string} version The state version
   * @param {function(new:IState)} clazz The state class
   * @param {string=} opt_type The state type
   */
  addStateImplementation(version, clazz, opt_type) {
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
          log.warning(this.log, 'Replacing state implementation in version ' + version +
              ' for tag "' + tag + '".');
        }

        this.versions[version][tag] = clazz;
      }
    } catch (e) {
      throw new Error('clazz must be a state constructor!');
    }
  }

  /**
   * Deactivates all states in the application.
   */
  clearStates() {
    // applications should extend this to actually do something, assuming they can save locally
  }

  /**
   * Deletes all local states
   */
  deleteStates() {
    // applications should extend this to actually do something, assuming they can save locally
  }

  /**
   * Get all available states.
   *
   * @param {boolean=} opt_allVersions Whether to get all versions.
   * @return {!Array<!IState>} The states
   */
  getAvailable(opt_allVersions) {
    var list = [];
    var enabledStates = /** @type {Object<string, boolean>} */ (Settings.getInstance().get('ex.enabledStates', {}));
    var s;
    var pushFn = function(statez) {
      for (var tag in statez) {
        s = new statez[tag]();
        if (enabledStates[stateToString(s)] !== false) {
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

    list.sort(titleCompare);
    list.sort(supportCompare);
    return list;
  }

  /**
   * Adds an imported state to the application and loads it.
   *
   * @param {!OSFile} file The state file
   * @param {S} options The state save options
   */
  addImportedState(file, options) {
    var url = file.getUrl();
    if (url && isLocal(url)) {
      // local file, so store it before finishing the import
      this.saveLocal(file, options);
    } else {
      // remote file, so just finish the import
      this.finishImport(file, options);
    }
  }

  /**
   * Checks if the provided state title is in use by the application.
   *
   * @param {string} title The title
   * @return {boolean} If the title has been used
   */
  hasState(title) {
    return false;
  }

  /**
   * Finish importing a state to the application.
   *
   * @param {!OSFile} file The stored file
   * @param {S} options The save options
   */
  finishImport(file, options) {
    // applications should override this function so it does something
  }

  /**
   * Initiate the state export process.
   *
   * @param {string=} opt_method Optional string label for the persistence method to default to.
   */
  startExport(opt_method) {
    var scopeOptions = {
      'method': opt_method
    };

    var windowOptions = {
      'id': EXPORT_WINDOW_ID,
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
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Saves the application state.
   *
   * @param {IPersistenceMethod} method The persistence method
   * @param {string} title The title
   * @param {string=} opt_desc The description
   * @param {string=} opt_tags The tags
   * @param {Array<!IState>=} opt_states The states to save
   */
  saveStates(method, title, opt_desc, opt_tags, opt_states) {
    var obj = this.createStateObject(method, title, opt_desc, opt_tags);
    var options = this.createStateOptions(method, title, obj, opt_desc, opt_tags);

    if (!opt_states) {
      opt_states = this.getAvailable();
    }

    if (opt_states) {
      options.states = opt_states;

      var deferred = new Deferred();
      for (var i = 0, n = opt_states.length; i < n; i++) {
        var state = opt_states[i];
        deferred.awaitDeferred(state.save(options));
      }

      deferred.addCallbacks(goog.partial(this.onSaveSuccess, options), this.onSaveError, this).callback();
    } else {
      this.onSaveError('No state types selected');
    }
  }

  /**
   * Handle state save success.
   *
   * @param {S} options The state save options
   * @protected
   */
  onSaveSuccess(options) {
    var content = this.serializeContent(options);
    var stateFileName = this.getStateFileName(options);
    assert(content != null, 'No state content to save!');
    assert(stateFileName != null, 'No state file name!');

    var persistMethod = options.method;
    if (persistMethod) {
      persistMethod.save(stateFileName, content, options.contentType || this.contentType, options.title,
          options.description, options.tags);
    } else {
      // user chose to save to the application so store the file locally
      try {
        var file = new OSFile();
        file.setFileName(stateFileName);
        file.setUrl(getLocalUrl(stateFileName));
        file.setContent(content);
        file.setContentType(this.contentType);

        FileStorage.getInstance().setUniqueFileName(file);

        if (!this.saveLocal(file, options)) {
          log.error(this.log, 'Failed saving state: unable to save locally');
        }
      } catch (e) {
        log.error(this.log, 'error saving state file to local storage: ' + e.message, e);
      }
    }
  }

  /**
   * Handle state save failure.
   *
   * @param {string} errorMsg The error message
   * @protected
   */
  onSaveError(errorMsg) {
    log.error(this.log, 'Failed saving state: ' + errorMsg);
  }

  /**
   * Removes components of a state file from the application.
   *
   * @param {string} id The base state id
   */
  removeState(id) {
    var list = this.getAvailable(true);
    for (var i = 0, n = list.length; i < n; i++) {
      try {
        var state = list[i];
        state.remove(id);
      } catch (e) {
        log.error(this.log, 'Could not remove ' + state.toString() + ': ' + e.message, e);
      }
    }
  }

  /**
   * Saves the state file locally in the application. Extending classes should implement this if supported.
   *
   * @param {!OSFile} file The file to save
   * @param {S} options The save options
   * @return {boolean} If the operation is supported and succeeded
   */
  saveLocal(file, options) {
    // always replace. if we got here the application should have done duplicate file detection already.
    var fs = FileStorage.getInstance();
    fs.storeFile(file, true).addCallbacks(goog.partial(this.finishImport, file, options), this.onFileError_, this);

    return true;
  }

  /**
   * Handler for file storage error.
   *
   * @param {*} error
   * @private
   */
  onFileError_(error) {
    if (typeof error === 'string') {
      log.error(this.log, 'Unable to store state file locally: ' + error);
    } else {
      log.error(this.log, 'Unable to store state file locally!');
    }
  }

  /**
   * Determine which parts of a state are supported by the application.
   *
   * @abstract
   * @param {T|string} obj The state
   * @return {!Array<!IState>} Supported states
   */
  analyze(obj) {}

  /**
   * Creates the root state object.
   *
   * @abstract
   * @param {IPersistenceMethod} method The persistence method
   * @param {string} title The title
   * @param {string=} opt_desc The description
   * @param {string=} opt_tags The tags
   * @return {T} The save options
   * @protected
   */
  createStateObject(method, title, opt_desc, opt_tags) {}

  /**
   * Creates state save options.
   *
   * @abstract
   * @param {IPersistenceMethod} method The persistence method
   * @param {string} title The title
   * @param {T} obj The root state object
   * @param {string=} opt_desc The description
   * @param {string=} opt_tags The tags
   * @return {S} The save options
   * @protected
   */
  createStateOptions(method, title, obj, opt_desc, opt_tags) {}

  /**
   * Gets the state file name.
   *
   * @abstract
   * @param {S} options The state options
   * @return {?string} The file name
   */
  getStateFileName(options) {}

  /**
   * Load a state from a document.
   *
   * @abstract
   * @param {T|string} obj The state
   * @param {Array<!IState>} states The states to load
   * @param {string} stateId The state's identifier
   * @param {?string=} opt_title The state's title
   */
  loadState(obj, states, stateId, opt_title) {}

  /**
   * Serializes the state file content to a string.
   *
   * @abstract
   * @param {S} options The state options
   * @return {?string} The serialized content
   */
  serializeContent(options) {}
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.BaseStateManager');

/**
 * Event types
 * @enum {string}
 */
BaseStateManager.EventType = {
  CLEAR: 'clear',
  DELETE: 'delete',
  LOADED: 'loaded'
};

exports = BaseStateManager;
