goog.provide('os.ui.im.FileImportUI');
goog.require('os.ui.im.AbstractImportUI');



/**
 * @extends {os.ui.im.AbstractImportUI.<T>}
 * @constructor
 * @template T
 */
os.ui.im.FileImportUI = function() {
  os.ui.im.FileImportUI.base(this, 'constructor');

  // default file import to requiring a local storage mechanism
  this.requiresStorage = true;
};
goog.inherits(os.ui.im.FileImportUI, os.ui.im.AbstractImportUI);


/**
 * @inheritDoc
 */
os.ui.im.FileImportUI.prototype.mergeConfig = function(from, to) {
  os.ui.im.FileImportUI.base(this, 'mergeConfig', from, to);
  to['descriptor'] = from['descriptor'];
  to['file'] = from['file'];
  to['oldFile'] = from['oldFile'];
  to['replace'] = from['replace'];
};
