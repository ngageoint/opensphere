goog.provide('os.ui.im.AbstractImportUI');
goog.require('os.ui.im.IImportUI');



/**
 * @implements {os.ui.im.IImportUI<T>}
 * @constructor
 * @template T
 */
os.ui.im.AbstractImportUI = function() {
  /**
   * If local storage is required by the import process.
   * @type {boolean}
   */
  this.requiresStorage = false;
};


/**
 * @inheritDoc
 */
os.ui.im.AbstractImportUI.prototype.getTitle = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.ui.im.AbstractImportUI.prototype.launchUI = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.im.AbstractImportUI.prototype.mergeConfig = function(from, to) {
  to['color'] = from['color'];
  to['description'] = from['description'];
  to['mappings'] = from['mappings'];
  to['tags'] = from['tags'];
  to['title'] = from['title'];
};
