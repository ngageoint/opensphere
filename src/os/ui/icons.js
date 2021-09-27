goog.declareModuleId('os.ui.Icons');

import {ROOT} from '../os.js';


/**
 * Icon image markup
 * @enum {string}
 */
const Icons = {
  DAYNIGHT: '<i class="fa fa-sun-o"></i><i class="fa fa-moon-o"></i>',
  FEATURES: '<img src="' + ROOT + 'images/features-base.png" title="Feature layer"/>',
  STATE: '<i class="fa fa-bookmark ml-1" title="State file"></i>',
  TERRAIN: '<i class="fa fa-area-chart" title="This layer provides terrain in 3D mode"></i>',
  TILES: '<img src="' + ROOT + 'images/tiles-base.png" title="Tile layer"/>',
  TIME: '<img class="time-icon" src="' + ROOT + 'images/time-base.png" ' +
      'title="This layer supports animation over time"/>',
  DEPRECATED: '<i class="fa fa-exclamation-circle text-danger" title="This layer is soon to be deleted"></i>',
  LOCK: '<i class="fa fa-lock" title="This layer is locked."></i>',
  COLOR_MODEL: '<i class="fa fa-tint ml-1" title="This layer has auto/manual coloring rules applied"></i>',
  FILTER: '<i class="fa fa-filter position-relative" title="This filter is active"></i>',
  FEATUREACTION: '<i class="fa fa-magic" title="This layer has an active feature action"></i>'
};

export default Icons;
