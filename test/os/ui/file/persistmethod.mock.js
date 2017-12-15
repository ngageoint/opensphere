goog.provide('os.ui.file.MockPersistMethod');



/**
 * Mock persistence method for unit tests.
 * @constructor
 */
os.ui.file.MockPersistMethod = function() {
  this.reqUserAction = true;
  this.supported = true;
};


/**
 * @type {string}
 * @const
 */
os.ui.file.MockPersistMethod.LABEL = 'Mock Persistence';


/**
 * The human-readable label for this persistence method.
 * @return {string}
 */
os.ui.file.MockPersistMethod.prototype.getLabel = function() {
  return os.ui.file.MockPersistMethod.LABEL;
};


/**
 * Whether or not the method is supported
 * @return {boolean}
 */
os.ui.file.MockPersistMethod.prototype.isSupported = function() {
  return this.supported;
};


/**
 * Whether the persistence method requires a user action in the call stack
 * @return {boolean}
 */
os.ui.file.MockPersistMethod.prototype.requiresUserAction = function() {
  return this.reqUserAction;
};


/**
 * Saves the given content
 * @param {string} fileName The file name (may not be applicable to all persistence methods)
 * @param {*} content The content to save
 * @param {string=} opt_mimeType The mime type of the content
 * @return {boolean} Whether or not the save action was successfull
 */
os.ui.file.MockPersistMethod.prototype.save = function(fileName, content, opt_mimeType) {
  return true;
};


/**
 * Reset to the default state.
 */
os.ui.file.MockPersistMethod.prototype.reset = function() {
  this.reqUserAction = true;
  this.supported = true;
};
