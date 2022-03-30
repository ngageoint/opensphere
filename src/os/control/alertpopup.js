goog.declareModuleId('os.control.AlertPopup');

import Control from 'ol/src/control/Control.js';

import {directiveTag as alertPopupUi} from '../ui/alert/alertpopup.js';
import * as osUi from '../ui/ui.js';


/**
 * Make the alert popups a map control so we can position it properly within
 * the map bounds
 */
export default class AlertPopup extends Control {
  /**
   * Constructor.
   */
  constructor() {
    // compile angular element
    var compile = /** @type {!angular.$compile} */ (osUi.injector.get('$compile'));
    var scope = /** @type {!angular.Scope} */ (osUi.injector.get('$rootScope')).$new();
    var el = compile(`<${alertPopupUi}></${alertPopupUi}>`)(scope)[0];

    super({
      element: el
    });
  }
}
