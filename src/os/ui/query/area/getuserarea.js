goog.declareModuleId('os.ui.query.area.getUserArea');

import {create} from '../../window.js';
import {EDIT_WIN_LABEL} from '../query.js';
import {directiveTag} from './userarea.js';

const Promise = goog.require('goog.Promise');

/**
 * Open a UI to get a user-defined area.
 *
 * @param {Feature=} opt_area The area.
 * @param {Array<string>=} opt_areaTypes The allowed area types.
 * @param {boolean=} opt_modal If the window should be modal.
 * @return {!goog.Promise} A promise that resolves to the entered area, or is rejected if the UI is closed.
 */
const getUserArea = function(opt_area, opt_areaTypes, opt_modal) {
  return new Promise(function(resolve, reject) {
    var id = opt_area ? opt_area.getId() : undefined;
    var title = 'Enter Area Coordinates';
    var icon = 'fa-calculator';

    if (id) {
      title = EDIT_WIN_LABEL;
      icon = 'fa-pencil';
    } else if (opt_area) {
      title = 'Save Area';
      icon = 'fa-globe';
    }

    var windowOptions = {
      'x': 'center',
      'y': 'center',
      'label': title,
      'icon': 'fa ' + icon,
      'height': 'auto',
      'width': 500,
      'modal': opt_modal || false,
      'show-close': true
    };

    var scopeOptions = {
      'confirm': resolve,
      'cancel': reject,
      'area': opt_area,
      'areaTypes': opt_areaTypes
    };

    create(windowOptions, `<${directiveTag}></${directiveTag}>`, undefined, undefined, undefined, scopeOptions);
  });
};

export default getUserArea;
