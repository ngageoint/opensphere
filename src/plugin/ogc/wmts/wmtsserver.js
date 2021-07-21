goog.module('plugin.ogc.wmts.WMTSServer');
goog.module.declareLegacyNamespace();

const QueryData = goog.require('goog.Uri.QueryData');
const log = goog.require('goog.log');
const IDataProvider = goog.require('os.data.IDataProvider');
const osImplements = goog.require('os.implements');
const OGCServer = goog.require('os.ui.ogc.OGCServer');

const Logger = goog.requireType('goog.log.Logger');


/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.ogc.wmts.WMTSServer');


/**
 * A WMTS-only server. WMTS can be loaded via OGCServer, but this provides backwards compatibility for WMTS server
 * configuration.
 *
 * @implements {IDataProvider}
 */
class WMTSServer extends OGCServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
    this.providerType = WMTSServer.TYPE;
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    this.init();
    this.setLabel(/** @type {string} */ (config['label']));
    this.setEnabled(/** @type {boolean} */ (config['enabled']));
    this.setEditable(/** @type {boolean} */ (config['editable']));
    this.setLowerCase(!!config['lowerCase']);

    const url = /** @type {string} */ (config['url']);
    if (url) {
      this.setWmtsUrl(url);
      this.setOriginalWmtsUrl(url);
    }

    this.setWmtsDateFormat(/** @type {string} */ (config['dateFormat']));
    this.setWmtsTimeFormat(/** @type {string} */ (config['timeFormat']));
    this.setWmtsParams('params' in config ? new QueryData(/** @type {string} */ (config['params'])) : null);
  }

  /**
   * The server type.
   * @type {string}
   * @override
   */
  static get TYPE() {
    return 'wmts';
  }
}
osImplements(WMTSServer, IDataProvider.ID);

exports = WMTSServer;
