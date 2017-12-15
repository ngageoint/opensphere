goog.provide('os.im.action.MockAction');

goog.require('os.im.action.AbstractImportAction');
goog.require('os.im.action.ImportActionManager');



/**
 * Mock action that sets the field 'MATCH' to true on each object.
 * @extends {os.im.action.AbstractImportAction<Object>}
 * @constructor
 */
os.im.action.MockAction = function() {
  os.im.action.MockAction.base(this, 'constructor');
  this.id = os.im.action.MockAction.ID;
  this.label = 'Mock Action';
  this.configUI = 'mockactionconfig'; // doesn't exist
};
goog.inherits(os.im.action.MockAction, os.im.action.AbstractImportAction);


/**
 * Mock action identifier.
 * @type {string}
 */
os.im.action.MockAction.ID = 'mockaction';


/**
 * Execute the mock action.
 * @param {!Array<!Object>} items The items.
 */
os.im.action.MockAction.prototype.execute = function(items) {
  items.forEach(function(item) {
    item.MATCH = true;
  });
};


/**
 * @inheritDoc
 */
os.im.action.MockAction.prototype.persist = function(opt_to) {
  return os.im.action.MockAction.base(this, 'persist', opt_to);
};


/**
 * @inheritDoc
 */
os.im.action.MockAction.prototype.restore = function(config) {
  // nothing to do
};


/**
 * Creates and returns a new import action manager with a registered mock action.
 * @return {!os.im.action.ImportActionManager}
 */
os.im.action.getMockManager = function() {
  var manager = new os.im.action.ImportActionManager();
  manager.registerAction(new os.im.action.MockAction());

  return manager;
};
