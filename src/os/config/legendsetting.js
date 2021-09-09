goog.module('os.config.LegendSetting');

const {DRAW_OPTIONS_KEY, POSITION_KEY} = goog.require('os.legend');


/**
 * Legend settings keys.
 * @enum {string}
 */
const LegendSetting = {
  // draw options
  BG_COLOR: DRAW_OPTIONS_KEY + '.bgColor',
  BOLD: DRAW_OPTIONS_KEY + '.bold',
  FONT_SIZE: DRAW_OPTIONS_KEY + '.fontSize',
  SHOW_VECTOR: DRAW_OPTIONS_KEY + '.showVector',
  SHOW_VECTOR_TYPE: DRAW_OPTIONS_KEY + '.showVectorType',
  SHOW_COUNT: DRAW_OPTIONS_KEY + '.showCount',
  SHOW_TILE: DRAW_OPTIONS_KEY + '.showTile',
  SHOW_BACKGROUND: DRAW_OPTIONS_KEY + '.showBackground',
  OPACITY: DRAW_OPTIONS_KEY + '.opacity',

  // position settings
  TOP: POSITION_KEY + '.top',
  LEFT: POSITION_KEY + '.left'
};

exports = LegendSetting;
