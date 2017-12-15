goog.provide('plugin.im.action.feature.legend');

goog.require('os.implements');
goog.require('os.legend');
goog.require('os.legend.ILegendRenderer');
goog.require('plugin.im.action.feature.StyleAction');


/**
 * Add feature style actions to the legend.
 * @param {!os.layer.Vector} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
plugin.im.action.feature.addToLegend = function(layer, options) {
  if (!options['showFeatureActions']) {
    return;
  }

  var source = /** @type {os.source.Vector} */ (layer.getSource());
  if (!source || !os.legend.shouldDrawSource(source)) {
    return;
  }

  var manager = plugin.im.action.feature.Manager.getInstance();
  var entries = manager.getActionEntries(source.getId()).filter(plugin.im.action.feature.hasLegendAction);

  var features = source.getFilteredFeatures();
  for (var i = 0; i < entries.length; i++) {
    // entry enabled state is not tested because the action(s) could still be applied. each action must determine if
    // they should be in the legend, unless the enabled/disabled state is changed to apply immediately.
    var entry = entries[i];
    var legendActions = /** @type {!Array<!os.legend.ILegendRenderer>} */ (entry.actions.filter(
        plugin.im.action.feature.isLegendAction));
    legendActions.forEach(function(action) {
      action.renderLegend(options, features, entry);
    });
  }
};


/**
 * Test if an entry contains actions that contribute to the legend.
 * @param {!os.im.action.FilterActionEntry} entry The entry.
 * @return {boolean} If the entry has actions that contribute to the legend.
 */
plugin.im.action.feature.hasLegendAction = function(entry) {
  return entry.actions.some(plugin.im.action.feature.isLegendAction);
};


/**
 * Test if an import action contributes to the legend.
 * @param {!os.im.action.IImportAction} action The action.
 * @return {boolean} If the action contributes to the legend.
 */
plugin.im.action.feature.isLegendAction = function(action) {
  return os.implements(action, os.legend.ILegendRenderer.ID);
};
