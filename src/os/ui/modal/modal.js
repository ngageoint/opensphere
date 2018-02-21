goog.provide('os.ui.modal');


/**
 * @param {string} target A selector used to identify the parent for the modal
 * @param {string} markup The markup to compile
 * @param {Object=} opt_scopeOptions
 */
os.ui.modal.create = function(target, markup, opt_scopeOptions) {
  var compile = /** @type {!angular.$compile} */ (os.ui.injector.get('$compile'));
  var scope = /** @type {!angular.Scope} */ (os.ui.injector.get('$rootScope').$new());

  Object.assign(scope, opt_scopeOptions);

  $(target).append(/** @type {Element} */ (compile(markup)(scope)[0]));
};


/**
 * Opens a modal
 * @param {!angular.JQLite} el
 * @param {Object<string, *>=} opt_options
 */
os.ui.modal.open = function(el, opt_options) {
  el.modal(opt_options).on('hide', function() {
    // let the animation complete
    setTimeout(function() {
      // and then remove it
      el.scope().$destroy();
      el.remove();
    }, 1500);
  });
};
