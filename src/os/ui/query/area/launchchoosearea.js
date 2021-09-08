goog.module('os.ui.query.area.launchChooseArea');

const {directiveTag} = goog.require('os.ui.query.area.ChooseAreaUI');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');

const Feature = goog.requireType('ol.Feature');


/**
 * @param {function(!Feature)} confirm
 * @param {Feature=} opt_default The default area to select
 */
exports = function(confirm, opt_default) {
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
