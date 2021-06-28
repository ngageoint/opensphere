goog.module('os.config.LegendSetting');
goog.module.declareLegacyNamespace();

const legend = goog.require('os.legend');

/**
 * Legend settings keys.
 * @enum {string}
 */
const LegendSetting = {
  // draw options
  BG_COLOR: legend.DRAW_OPTIONS_KEY + '.bgColor',
  BOLD: legend.DRAW_OPTIONS_KEY + '.bold',
  FONT_SIZE: legend.DRAW_OPTIONS_KEY + '.fontSize',
  SHOW_VECTOR: legend.DRAW_OPTIONS_KEY + '.showVector',
  SHOW_VECTOR_TYPE: legend.DRAW_OPTIONS_KEY + '.showVectorType',
  SHOW_COUNT: legend.DRAW_OPTIONS_KEY + '.showCount',
  SHOW_TILE: legend.DRAW_OPTIONS_KEY + '.showTile',
  SHOW_BACKGROUND: legend.DRAW_OPTIONS_KEY + '.showBackground',
  OPACITY: legend.DRAW_OPTIONS_KEY + '.opacity',

  // position settings
  TOP: legend.POSITION_KEY + '.top',
  LEFT: legend.POSITION_KEY + '.left'
};

exports = LegendSetting;
