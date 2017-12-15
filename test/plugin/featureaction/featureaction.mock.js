goog.provide('plugin.im.action.feature.MockAction');

goog.require('os.im.action.AbstractImportAction');
goog.require('plugin.im.action.feature.Manager');



/**
 * Mock action that sets the field 'MATCH' to true on each object.
 * @extends {os.im.action.AbstractImportAction<ol.Feature>}
 * @constructor
 */
plugin.im.action.feature.MockAction = function() {
  plugin.im.action.feature.MockAction.base(this, 'constructor');
  this.id = plugin.im.action.feature.MockAction.ID;
  this.label = 'Mock Feature Action';
  this.configUI = 'mockfeatureactionconfig'; // doesn't exist
  this.xmlType = 'mockFeatureAction';
};
goog.inherits(plugin.im.action.feature.MockAction, os.im.action.AbstractImportAction);


/**
 * Mock action identifier.
 * @type {string}
 */
plugin.im.action.feature.MockAction.ID = 'mockfeatureaction';


/**
 * Execute the mock action.
 * @param {!Array<!ol.Feature>} items The items.
 */
plugin.im.action.feature.MockAction.prototype.execute = function(items) {
  items.forEach(function(item) {
    item.set('MATCH', true);
  });
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.MockAction.prototype.persist = function(opt_to) {
  return plugin.im.action.feature.MockAction.base(this, 'persist', opt_to);
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.MockAction.prototype.restore = function(config) {
  // nothing to do
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.MockAction.prototype.toXml = function() {
  return plugin.im.action.feature.MockAction.base(this, 'toXml');
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.MockAction.prototype.fromXml = function(xml) {
  // nothing to do
};


/**
 * Creates and returns a new feature action manager with a registered mock action.
 * @return {!plugin.im.action.feature.Manager}
 */
plugin.im.action.feature.getMockManager = function() {
  var manager = new plugin.im.action.feature.Manager();
  manager.registerAction(new plugin.im.action.feature.MockAction());

  return manager;
};
