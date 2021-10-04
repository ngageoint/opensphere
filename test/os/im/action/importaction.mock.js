goog.module('os.im.action.mock');

const {default: ImportActionManager} = goog.require('os.im.action.ImportActionManager');
const MockAction = goog.require('os.im.action.mock.MockAction');


/**
 * Creates and returns a new import action manager with a registered mock action.
 * @return {!ImportActionManager}
 */
const getMockManager = function() {
  var manager = new ImportActionManager();
  manager.registerAction(new MockAction());

  return manager;
};

exports = {
  getMockManager
};
