goog.declareModuleId('os.ui.query.area.launchChooseArea');

import * as ConfirmUI from '../../window/confirm.js';
import {directiveTag} from './choosearea.js';

/**
 * @param {function(!Feature)} confirm
 * @param {Feature=} opt_default The default area to select
 */
const launchChooseArea = function(confirm, opt_default) {
  ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: opt_default,
    prompt: `<span>Please choose an area from the list:</span><${directiveTag}></${directiveTag}>`,
    windowOptions: {
      'label': 'Choose Area',
      'icon': 'fa fa-list-ul',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'height': 'auto',
      'show-close': 'true',
      'modal': 'true'
    }
  }));
};

export default launchChooseArea;
