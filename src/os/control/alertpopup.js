goog.module('os.control.AlertPopup');

const Control = goog.require('ol.control.Control');
const osUi = goog.require('os.ui');
const {directiveTag: alertPopupUi} = goog.require('os.ui.alert.AlertPopupUI');


/**
 * Make the alert popups a map control so we can position it properly within
 * the map bounds
 */
class AlertPopup extends Control {
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

exports = AlertPopup;
