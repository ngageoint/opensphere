goog.provide('os.ui.im.DuplicateAlwaysReimportProcess');
goog.require('os.ui.im.ImportProcess');



/**
 * Extension of the {@code os.ui.im.DuplcateImportProcess} to always choose the option to reimport.
 * @constructor
 * @extends {os.ui.im.ImportProcess}
 */
os.ui.im.DuplicateAlwaysReimportProcess = function() {
  os.ui.im.DuplicateAlwaysReimportProcess.base(this, 'constructor');
};
goog.inherits(os.ui.im.DuplicateAlwaysReimportProcess, os.ui.im.ImportProcess);


/**
 * Override parent to always reimport
 * @inheritDoc
 */
os.ui.im.DuplicateAlwaysReimportProcess.prototype.onFileExists = function() {
  this.importFile();
};


/**
 * Override parent to always reimport
 * @inheritDoc
 */
os.ui.im.DuplicateAlwaysReimportProcess.prototype.onUrlExists = function() {
  this.importFile();
};
