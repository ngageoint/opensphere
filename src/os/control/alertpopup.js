goog.module('os.control.AlertPopup');
goog.module.declareLegacyNamespace();

goog.require('os.ui.alert.alertPopupDirective');

const Control = goog.require('ol.control.Control');
const osUi = goog.require('os.ui');


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
    var el = compile('<alert-popup></alert-popup>')(scope)[0];

    super({
      element: el
    });
  }
}

exports = AlertPopup;
