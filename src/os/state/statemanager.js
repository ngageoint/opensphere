goog.module('os.state.StateManager');
goog.module.declareLegacyNamespace();

const {defaultCompare, insert} = goog.require('goog.array');
const {getFirstElementChild} = goog.require('goog.dom');
const log = goog.require('goog.log');
const {remove} = goog.require('ol.array');
const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const osImplements = goog.require('os.implements');
const {deleteStates} = goog.require('os.state');
const BaseStateManager = goog.require('os.state.BaseStateManager');
const StateDescriptor = goog.require('os.state.StateDescriptor');
const Versions = goog.require('os.state.Versions');
const XMLStateManager = goog.require('os.state.XMLStateManager');
const BaseFilter = goog.require('os.state.v2.BaseFilter');
const ExclusionArea = goog.require('os.state.v2.ExclusionArea');
const Filter = goog.require('os.state.v2.Filter');
const V2LayerState = goog.require('os.state.v2.LayerState');
const V2QueryArea = goog.require('os.state.v2.QueryArea');
const QueryEntries = goog.require('os.state.v2.QueryEntries');
const V2TimeState = goog.require('os.state.v2.TimeState');
const V2ViewState = goog.require('os.state.v2.ViewState');
const V3LayerState = goog.require('os.state.v3.LayerState');
const LayerState = goog.require('os.state.v4.LayerState');
const QueryArea = goog.require('os.state.v4.QueryArea');
const TimeState = goog.require('os.state.v4.TimeState');
const ViewState = goog.require('os.state.v4.ViewState');
const BaseProvider = goog.require('os.ui.data.BaseProvider');
const {EXPORT_WINDOW_ID} = goog.require('os.ui.state');
const IStateDescriptor = goog.require('os.ui.state.IStateDescriptor');
const StateProvider = goog.require('os.ui.state.StateProvider');
const osWindow = goog.require('os.ui.window');

const Logger = goog.requireType('goog.log.Logger');


/**
 * State manager.
 */
class StateManager extends XMLStateManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
    this.setVersion(Versions.V4);

    // register the base map provider type
    var dm = DataManager.getInstance();
    dm.registerProviderType(new ProviderEntry(
        'state',
        StateProvider,
        'State Files',
        'Contains all state files'));

    // register the state descriptor type
    dm.registerDescriptorType('state', StateDescriptor);

    // V1 is not supported

    // V2 states
    this.addStateImplementation(Versions.V2, ExclusionArea);
    this.addStateImplementation(Versions.V2, Filter);
    this.addStateImplementation(Versions.V2, V2LayerState);
    this.addStateImplementation(Versions.V2, V2QueryArea);
    this.addStateImplementation(Versions.V2, QueryEntries);
    this.addStateImplementation(Versions.V2, V2TimeState);
    this.addStateImplementation(Versions.V2, V2ViewState);

    // V3 states
    this.addStateImplementation(Versions.V3, ExclusionArea);
    this.addStateImplementation(Versions.V3, Filter);
    this.addStateImplementation(Versions.V3, V3LayerState);
    this.addStateImplementation(Versions.V3, V2QueryArea);
    this.addStateImplementation(Versions.V3, QueryEntries);
    this.addStateImplementation(Versions.V3, V2TimeState);
    this.addStateImplementation(Versions.V3, V2ViewState);

    // V4 states
    this.addStateImplementation(Versions.V4, ExclusionArea);
    this.addStateImplementation(Versions.V4, Filter);
    this.addStateImplementation(Versions.V4, LayerState);
    this.addStateImplementation(Versions.V4, QueryArea);
    this.addStateImplementation(Versions.V4, QueryEntries);
    this.addStateImplementation(Versions.V4, TimeState);
    this.addStateImplementation(Versions.V4, ViewState);

    /**
     * A map that contains the load functions
     * @type {Object}
     * @private
     */
    this.functionMap_ = {};
    this.functionMap_[Versions.V2] = {
      loadFunctions: [BaseFilter.preload],
      saveFunctions: []
    };
    this.functionMap_[Versions.V3] = {
      loadFunctions: [BaseFilter.preload],
      saveFunctions: []
    };
    this.functionMap_[Versions.V4] = {
      loadFunctions: [BaseFilter.preload],
      saveFunctions: []
    };
  }

  /**
   * @inheritDoc
   */
  clearStates() {
    var dataManager = DataManager.getInstance();
    var list = dataManager.getDescriptors('state' + BaseProvider.ID_DELIMITER);
    list.forEach(function(d) {
      d.setActive(false);
    });

    this.dispatchEvent(BaseStateManager.EventType.CLEAR);
  }

  /**
   * @inheritDoc
   */
  deleteStates() {
    var dataManager = DataManager.getInstance();
    var list = dataManager.getDescriptors('state' + BaseProvider.ID_DELIMITER);
    deleteStates(list);
  }

  /**
   * @inheritDoc
   */
  hasState(title) {
    var dm = DataManager.getInstance();
    var descriptors = dm.getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      if (descriptors[i].getTitle() == title) {
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  finishImport(file, options) {
    // first check if the descriptor already exists
    var dm = DataManager.getInstance();
    var sp = StateProvider.getInstance();
    var descriptor = null;
    var descriptors = dm.getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      var url = file.getUrl();
      if (descriptors[i] instanceof StateDescriptor && url && descriptors[i].matchesURL(url)) {
        // found an existing descriptor
        descriptor = /** @type {StateDescriptor} */ (descriptors[i]);
        break;
      }
    }

    // if not, create one
    if (!descriptor) {
      descriptor = StateDescriptor.createFromFile(file);
      descriptor.setId(sp.getUniqueId());
      descriptor.setProvider(sp.getLabel());
      descriptor.touchLastActive();
    }

    // update from the provided save options and add the descriptor to the application
    StateDescriptor.updateFromOptions(descriptor, options);
    dm.addDescriptor(descriptor);
    sp.addDescriptor(descriptor, options.load);
  }

  /**
   * This override attempts to populate some data into the state form based on the most recently activated state.
   *
   * @override
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

    var descriptors = DataManager.getInstance().getDescriptors();
    var stateDescriptors = [];

    descriptors.forEach(function(descriptor) {
      if (osImplements(descriptor, IStateDescriptor.ID) && descriptor.isActive()) {
        var stateDescriptor = /** @type {IStateDescriptor} */ (descriptor);
        stateDescriptors.push(stateDescriptor);
      }
    });

    if (stateDescriptors.length) {
      // sort by last active to get the most recently activated state and default in its details
      stateDescriptors.sort(function(a, b) {
        return defaultCompare(a, b);
      });

      var descriptor = /** @type {IStateDescriptor} */ (stateDescriptors[0]);
      scopeOptions['title'] = descriptor.getTitle();
      scopeOptions['method'] = descriptor.getDefaultPersister();
      scopeOptions['description'] = descriptor.getDescription();
      scopeOptions['tags'] = descriptor.getTags() ? descriptor.getTags().join(', ') : undefined;
    }

    var template = '<stateexport method="method"></stateexport>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @param  {Document|string} obj
   * @private
   */
  beforeLoad_(obj) {
    if (obj && obj instanceof Document && getFirstElementChild(obj) instanceof Element) {
      var elem = getFirstElementChild(obj);
      var ns = elem.namespaceURI;

      // Extract the version from the state file.
      var versionKey;
      if (ns) {
        var index = ns.lastIndexOf('/');

        if (index < 0) {
          // Could not find a '/'
          versionKey = this.getVersion();
          var msg = 'Could not extract the version number from the xmlns: ' + ns + '. Using the default: ' + versionKey;
          log.warning(logger, msg);
        } else {
          versionKey = ns.substr(index + 1);
          if (!versionKey) {
            versionKey = this.getVersion();
            var msg = 'Could not extract the version number from the xmlns: ' + ns + '. Using the default: ' +
              versionKey;
            log.warning(logger, msg);
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
  }

  /**
   * @inheritDoc
   */
  analyze(obj) {
    this.beforeLoad_(obj);
    return super.analyze(obj);
  }

  /**
   * @inheritDoc
   */
  loadState(obj, states, stateId, opt_title) {
    this.beforeLoad_(obj);
    super.loadState(obj, states, stateId, opt_title);
  }

  /**
   * Adds a load function that can be used to modify the state file before passing it to the state
   * implementations registered above.
   *
   * @param {function(!Element)} loadFunction
   * @param {string=} opt_versionKey The version of the states that the function supports.
   */
  addLoadFunction(loadFunction, opt_versionKey) {
    if (!opt_versionKey) {
      opt_versionKey = this.getVersion();
    }
    insert(this.functionMap_[opt_versionKey].loadFunctions, loadFunction);
  }

  /**
   * Removes a load function
   *
   * @param {function(!Element)} loadFunction
   * @param {string=} opt_versionKey The version of the states that the function supports.
   */
  removeLoadFunction(loadFunction, opt_versionKey) {
    if (!opt_versionKey) {
      opt_versionKey = this.getVersion();
    }
    remove(this.functionMap_[opt_versionKey].loadFunctions, loadFunction);
  }

  /**
   * Adds a save function that can be used to modify the state file after all the state implementations
   * have run.
   *
   * @param {function(!Element)} saveFunction
   * @param {string=} opt_versionKey The version of the states that the function supports.
   */
  addSaveFunction(saveFunction, opt_versionKey) {
    if (!opt_versionKey) {
      opt_versionKey = this.getVersion();
    }
    insert(this.functionMap_[opt_versionKey].saveFunctions, saveFunction);
  }

  /**
   * Removes a save function
   *
   * @param {function(!Element)} saveFunction
   * @param {string=} opt_versionKey The version of the states that the function supports.
   */
  removeSaveFunction(saveFunction, opt_versionKey) {
    if (!opt_versionKey) {
      opt_versionKey = this.getVersion();
    }
    remove(this.functionMap_[opt_versionKey].saveFunctions, saveFunction);
  }

  /**
   * @inheritDoc
   */
  onSaveSuccess(options) {
    var el = getFirstElementChild(options.doc);

    if (el) {
      var functions = this.functionMap_[this.getVersion()];
      for (var i = 0, n = functions.saveFunctions.length; i < n; i++) {
        functions.saveFunctions[i](el);
      }
    }

    super.onSaveSuccess(options);
  }

  /**
   * Get the global instance.
   * @return {!StateManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new StateManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {StateManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {StateManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.StateManager');

exports = StateManager;
