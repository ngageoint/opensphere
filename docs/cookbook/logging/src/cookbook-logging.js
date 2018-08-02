goog.provide('plugin.cookbook_logging.CookbookLogging');

goog.require('goog.debug.Logger.Level');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');


/**
 * Cookbook example of logging
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cookbook_logging.CookbookLogging = function() {
  plugin.cookbook_logging.CookbookLogging.base(this, 'constructor');
  this.id = plugin.cookbook_logging.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.cookbook_logging.CookbookLogging, os.plugin.AbstractPlugin);

/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.cookbook_logging.CookbookLogging.LOGGER_ = goog.log.getLogger('plugin.cookbook_logging.CookbookLogging');

/**
 * @type {string}
 * @const
 */
plugin.cookbook_logging.ID = 'cookbook_logging';


/**
 * @inheritDoc
 */
plugin.cookbook_logging.CookbookLogging.prototype.init = function() {
  goog.log.info(plugin.cookbook_logging.CookbookLogging.LOGGER_, 'Visible at INFO or below');
  goog.log.warning(plugin.cookbook_logging.CookbookLogging.LOGGER_, 'Visible at WARN or below');
  goog.log.log(plugin.cookbook_logging.CookbookLogging.LOGGER_, goog.debug.Logger.Level.FINEST, 'Visible only at FINEST or ALL');
  goog.log.error(plugin.cookbook_logging.CookbookLogging.LOGGER_, 'ALWAYS VISIBLE!');
};

// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.cookbook_logging.CookbookLogging());
