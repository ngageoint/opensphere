goog.provide('os.legend.ILegendRenderer');



/**
 * Interface for layers that contribute to the legend.
 * @interface
 */
os.legend.ILegendRenderer = function() {};


/**
 * Legend layer interface id.
 * @type {string}
 * @const
 */
os.legend.ILegendRenderer.ID = 'os.legend.ILegendRenderer';


/**
 * Render items to a legend.
 * @param {!osx.legend.LegendOptions} options The legend options.
 * @param {...*} var_args Additional arguments defined by the implementing class.
 */
os.legend.ILegendRenderer.prototype.renderLegend;
