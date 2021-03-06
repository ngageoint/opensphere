goog.module('plugin.im.action.feature.legend');
goog.module.declareLegacyNamespace();

const osImplements = goog.require('os.implements');
const legend = goog.require('os.legend');
const ILegendRenderer = goog.require('os.legend.ILegendRenderer');
const FeatureActionManager = goog.require('plugin.im.action.feature.Manager');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const IImportAction = goog.requireType('os.im.action.IImportAction');
const VectorLayer = goog.requireType('os.layer.Vector');
const VectorSource = goog.requireType('os.source.Vector');


/**
 * Add feature style actions to the legend.
 *
 * @param {!VectorLayer} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
const addToLegend = function(layer, options) {
  if (!options['showFeatureActions']) {
    return;
  }

  var source = /** @type {VectorSource} */ (layer.getSource());
  if (!source || !legend.shouldDrawSource(source)) {
    return;
  }

  var manager = FeatureActionManager.getInstance();
  var entries = manager.getActionEntries(source.getId()).filter(hasLegendAction);

  var features = source.getFilteredFeatures();
  for (var i = 0; i < entries.length; i++) {
    // entry enabled state is not tested because the action(s) could still be applied. each action must determine if
    // they should be in the legend, unless the enabled/disabled state is changed to apply immediately.
    var entry = entries[i];
    var legendActions = /** @type {!Array<!ILegendRenderer>} */ (entry.actions.filter(isLegendAction));
    legendActions.forEach(function(action) {
      action.renderLegend(options, features, entry);
    });
  }
};


/**
 * Test if an entry contains actions that contribute to the legend.
 *
 * @param {!FilterActionEntry} entry The entry.
 * @return {boolean} If the entry has actions that contribute to the legend.
 */
const hasLegendAction = function(entry) {
  return entry.actions.some(isLegendAction);
};


/**
 * Test if an import action contributes to the legend.
 *
 * @param {!IImportAction} action The action.
 * @return {boolean} If the action contributes to the legend.
 */
const isLegendAction = function(action) {
  return osImplements(action, ILegendRenderer.ID);
};

exports = {
  addToLegend,
  hasLegendAction,
  isLegendAction
};
