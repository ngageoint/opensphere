goog.declareModuleId('plugin.cookbook_logging.CookbookLogging');

import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';

const log = goog.require('goog.log');
const Level = goog.require('goog.log.Level');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Cookbook example of logging.
 */
export default class CookbookLogging extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    log.info(logger, 'Visible at INFO or below');
    log.warning(logger, 'Visible at WARN or below');
    log.log(logger, Level.FINEST, 'Visible only at FINEST or ALL');
    log.error(logger, 'ALWAYS VISIBLE!');
  }
}

/**
 * Logger.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.cookbook_logging.CookbookLogging');

/**
 * @type {string}
 */
export const ID = 'cookbook_logging';

// add the plugin to the application
PluginManager.getInstance().addPlugin(new CookbookLogging());
