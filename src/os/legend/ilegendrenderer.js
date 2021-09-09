goog.module('os.legend.ILegendRenderer');

/**
 * Interface for layers that contribute to the legend.
 *
 * @interface
 */
class ILegendRenderer {
  /**
   * Render items to a legend.
   * @param {!osx.legend.LegendOptions} options The legend options.
   * @param {...*} var_args Additional arguments defined by the implementing class.
   */
  renderLegend(options, var_args) {}
}

/**
 * Legend layer interface id.
 * @type {string}
 * @const
 */
ILegendRenderer.ID = 'os.legend.ILegendRenderer';

exports = ILegendRenderer;
