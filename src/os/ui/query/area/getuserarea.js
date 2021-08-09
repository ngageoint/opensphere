goog.module('os.ui.query.area.getUserArea');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const {EDIT_WIN_LABEL} = goog.require('os.ui.query');
const {directiveTag} = goog.require('os.ui.query.area.UserAreaUI');
const {create} = goog.require('os.ui.window');

const Feature = goog.requireType('ol.Feature');


/**
 * Open a UI to get a user-defined area.
 *
 * @param {Feature=} opt_area The area.
 * @param {Array<string>=} opt_areaTypes The allowed area types.
 * @param {boolean=} opt_modal If the window should be modal.
 * @return {!goog.Promise} A promise that resolves to the entered area, or is rejected if the UI is closed.
 */
exports = function(opt_area, opt_areaTypes, opt_modal) {
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
