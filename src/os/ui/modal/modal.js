goog.provide('os.ui.modal');

goog.require('ol.obj');


/**
 * @param {string} target A selector used to identify the parent for the modal
 * @param {string} markup The markup to compile
 * @param {Object=} opt_scopeOptions
 */
os.ui.modal.create = function(target, markup, opt_scopeOptions) {
  var compile = /** @type {!angular.$compile} */ (os.ui.injector.get('$compile'));
  var scope = /** @type {!angular.Scope} */ (os.ui.injector.get('$rootScope').$new());

  ol.obj.assign(scope, opt_scopeOptions || null);

  var parent = $(target);
  parent.append(/** @type {Element} */ (compile(markup)(scope)[0]));
  if (parent.scope()) {
    parent.scope().$on('$destroy', function() {
      // If the parent is being destroyed, make sure the backdrop is removed with it
      // This case is with a modal open and the back button hit
      $('body > .modal-backdrop').remove();
    });
  }
};


/**
 * Opens a modal
 * @param {!angular.JQLite} el
 * @param {Object<string, *>=} opt_options
 */
os.ui.modal.open = function(el, opt_options) {
  // Tabindex -1 is required for the modal to close on the ESC key
  el.attr('tabindex', '-1');
  var options = opt_options || {};
  if (!options['backdrop']) {
    // By default, dont close the modal if you click outside of it
    options['backdrop'] = 'static';
  }
  el.modal(options).on('hidden.bs.modal', function() {
    // Cleanup the scope & element
    if (el.scope()) {
      el.scope().$destroy();
    }
    el.remove();
  });
};
