goog.declareModuleId('plugin.im.action.feature.legend');

import osImplements from '../../os/implements.js';
import ILegendRenderer from '../../os/legend/ilegendrenderer.js';
import * as legend from '../../os/legend/legend.js';
import FeatureActionManager from './featureactionmanager.js';


/**
 * Add feature style actions to the legend.
 *
 * @param {!VectorLayer} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
export const addToLegend = function(layer, options) {
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
export const hasLegendAction = function(entry) {
  return entry.actions.some(isLegendAction);
};

/**
 * Test if an import action contributes to the legend.
 *
 * @param {!IImportAction} action The action.
 * @return {boolean} If the action contributes to the legend.
 */
export const isLegendAction = function(action) {
  return osImplements(action, ILegendRenderer.ID);
};
