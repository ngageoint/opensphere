goog.provide('os.control.AlertPopup');
goog.require('ol.control.Control');
goog.require('os.ui.alert.alertPopupDirective');



/**
 * Make the alert popups a map control so we can position it properly within
 * the map bounds
 *
 * @extends {ol.control.Control}
 * @constructor
 */
os.control.AlertPopup = function() {
  // compile angular element
  var compile = /** @type {!angular.$compile} */ (os.ui.injector.get('$compile'));
  var scope = /** @type {!angular.Scope} */ (os.ui.injector.get('$rootScope')).$new();
  var el = compile('<alert-popup></alert-popup>')(scope)[0];

  os.control.AlertPopup.base(this, 'constructor', {
    element: el
  });
};
goog.inherits(os.control.AlertPopup, ol.control.Control);
