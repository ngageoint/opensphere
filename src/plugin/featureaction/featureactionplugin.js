goog.module('plugin.im.action.feature.Plugin');
goog.module.declareLegacyNamespace();

const legend = goog.require('os.legend');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const StateManager = goog.require('os.state.StateManager');
const FilterAction = goog.require('os.state.v4.FilterAction');
const FilterActionImportUI = goog.require('os.ui.im.action.FilterActionImportUI');
const mime = goog.require('plugin.featureaction.mime');
const featureAction = goog.require('plugin.im.action.feature');
const LabelAction = goog.require('plugin.im.action.feature.LabelAction');
const Manager = goog.require('plugin.im.action.feature.Manager');
const SoundAction = goog.require('plugin.im.action.feature.SoundAction');
const StyleAction = goog.require('plugin.im.action.feature.StyleAction');
const {addToLegend} = goog.require('plugin.im.action.feature.legend');
const faMenu = goog.require('plugin.im.action.feature.menu');
const node = goog.require('plugin.im.action.feature.node');
const {directiveTag: legendSettingsUi} = goog.require('plugin.im.action.feature.ui.legendSettingsDirective');


/**
 * Plugin to create actions that apply to imported features.
 */
class Plugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.id = featureAction.ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    faMenu.layerDispose();

    node.dispose();
  }

  /**
   * @inheritDoc
   */
  init() {
    // initialize the import action manager and register default actions
    var manager = Manager.getInstance();
    manager.registerAction(new LabelAction());
    manager.registerAction(new StyleAction());
    manager.registerAction(new SoundAction());

    // register import UI
    os.ui.im.ImportManager.getInstance().registerImportUI(mime.TYPE,
        new FilterActionImportUI());

    // add actions
    faMenu.layerSetup();

    // register the state
    var sm = StateManager.getInstance();

    // TODO: shouldn't need to dual-register after THIN-8551
    sm.addStateImplementation(os.state.Versions.V3, FilterAction);
    sm.addStateImplementation(os.state.Versions.V4, FilterAction);

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

exports = Plugin;
