goog.provide('plugin.im.action.feature.Plugin');

goog.require('goog.events.EventTarget');
goog.require('os.legend');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.state.StateManager');
goog.require('os.state.v4.FilterAction');
goog.require('os.ui.im.action.FilterActionImportUI');
goog.require('plugin.featureaction.mime');
goog.require('plugin.im.action.feature');
goog.require('plugin.im.action.feature.LabelAction');
goog.require('plugin.im.action.feature.Manager');
goog.require('plugin.im.action.feature.SoundAction');
goog.require('plugin.im.action.feature.StyleAction');
goog.require('plugin.im.action.feature.legend');
goog.require('plugin.im.action.feature.menu');
goog.require('plugin.im.action.feature.node.menu');
goog.require('plugin.im.action.feature.ui.featureActionsDirective');
goog.require('plugin.im.action.feature.ui.labelConfigDirective');
goog.require('plugin.im.action.feature.ui.legendSettingsDirective');
goog.require('plugin.im.action.feature.ui.styleConfigDirective');



/**
 * Plugin to create actions that apply to imported features.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.im.action.feature.Plugin = function() {
  plugin.im.action.feature.Plugin.base(this, 'constructor');

  this.id = plugin.im.action.feature.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.im.action.feature.Plugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.im.action.feature.Plugin);


/**
 * @inheritDoc
 */
plugin.im.action.feature.Plugin.prototype.disposeInternal = function() {
  plugin.im.action.feature.Plugin.base(this, 'disposeInternal');

  plugin.im.action.feature.layerDispose();

  plugin.im.action.feature.node.menu.dispose();
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.Plugin.prototype.init = function() {
  // initialize the import action manager and register default actions
  var manager = plugin.im.action.feature.Manager.getInstance();
  manager.registerAction(new plugin.im.action.feature.LabelAction());
  manager.registerAction(new plugin.im.action.feature.StyleAction());
  manager.registerAction(new plugin.im.action.feature.SoundAction());

  // register import UI
  os.ui.im.ImportManager.getInstance().registerImportUI(plugin.featureaction.mime.TYPE,
      new os.ui.im.action.FilterActionImportUI());

  // add actions
  plugin.im.action.feature.layerSetup();

  // register the state
  var sm = os.state.StateManager.getInstance();

  // TODO: shouldn't need to dual-register after THIN-8551
  sm.addStateImplementation(os.state.Versions.V3, os.state.v4.FilterAction);
  sm.addStateImplementation(os.state.Versions.V4, os.state.v4.FilterAction);

  plugin.im.action.feature.node.menu.setup();

  // add legend renderer
  os.legend.registerLayerPlugin(/** @type {!osx.legend.PluginOptions} */ ({
    priority: 1000,
    render: plugin.im.action.feature.addToLegend,
    settingsUI: 'featureactionlegendsettings',
    defaultSettings: {
      'showFeatureActions': true
    }
  }));
};
