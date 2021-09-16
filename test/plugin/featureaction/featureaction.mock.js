goog.module('plugin.im.action.feature.mock');

const Manager = goog.require('plugin.im.action.feature.Manager');
const MockAction = goog.require('plugin.im.action.feature.mock.MockAction');


/**
 * Creates and returns a new feature action manager with a registered mock action.
 * @return {!Manager}
 */
const getMockManager = function() {
  var manager = new Manager();
  manager.registerAction(new MockAction());

  return manager;
};

exports = {
  getMockManager
};
