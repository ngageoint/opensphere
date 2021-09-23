goog.declareModuleId('plugin.im.action.feature.Plugin');

import {ID} from './featureaction.js';
import {addToLegend} from './featureactionlegendrenderer.js';
import FeatureActionManager from './featureactionmanager.js';
import {layerDispose, layerSetup} from './featureactionmenu.js';
import * as node from './featureactionnodemenu.js';
import LabelAction from './featurelabelaction.js';
import SoundAction from './featuresoundaction.js';
import StyleAction from './featurestyleaction.js';
import * as mime from './mime.js';
import {directiveTag as legendSettingsUi} from './ui/featureactionlegendsettings.js';

const legend = goog.require('os.legend');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const StateManager = goog.require('os.state.StateManager');
const Versions = goog.require('os.state.Versions');
const FilterAction = goog.require('os.state.v4.FilterAction');
const ImportManager = goog.require('os.ui.im.ImportManager');
const FilterActionImportUI = goog.require('os.ui.im.action.FilterActionImportUI');

/**
 * Plugin to create actions that apply to imported features.
 */
export default class Plugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    layerDispose();

    node.dispose();
  }

  /**
   * @inheritDoc
   */
  init() {
    // initialize the import action manager and register default actions
    var manager = FeatureActionManager.getInstance();
    manager.registerAction(new LabelAction());
    manager.registerAction(new StyleAction());
    manager.registerAction(new SoundAction());

    // register import UI
    ImportManager.getInstance().registerImportUI(mime.TYPE, new FilterActionImportUI());

    // add actions
    layerSetup();

    // register the state
    var sm = StateManager.getInstance();

    // TODO: shouldn't need to dual-register after THIN-8551
    sm.addStateImplementation(Versions.V3, FilterAction);
    sm.addStateImplementation(Versions.V4, FilterAction);

    node.setup();

    // add legend renderer
    legend.registerLayerPlugin(/** @type {!osx.legend.PluginOptions} */ ({
      priority: 1000,
      render: addToLegend,
      settingsUI: legendSettingsUi,
      defaultSettings: {
        'showFeatureActions': true
      }
    }));
  }

  /**
   * Get the global instance.
   * @return {!Plugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new Plugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Plugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {Plugin|undefined}
 */
let instance;
