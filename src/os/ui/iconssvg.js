goog.declareModuleId('os.ui.IconsSVG');

import {ROOT} from '../os.js';


/**
 * Icon svg markup
 * @enum {string}
 */
const IconsSVG = {
  FEATURES: '<image xlink:href="' + ROOT + 'images/features-base.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>Feature layer</title></image>',
  TILES: '<image xlink:href="' + ROOT + 'images/tiles-base.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>Tile layer</title></image>',
  TIME: '<image class="time-icon" xlink:href="' + ROOT + 'images/time-base.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>This layer supports animation over time</title></image>',
  LOCK: '<image xlink:href="' + ROOT + 'images/lock_tiny_white.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>This layer is locked.</title></image>'
};

export default IconsSVG;
