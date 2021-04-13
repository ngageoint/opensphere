goog.module('plugin.xyz.XYZServer');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const IDataProvider = goog.require('os.data.IDataProvider');
const osImplements = goog.require('os.implements');

const Logger = goog.requireType('goog.log.Logger');



/**
 * The XYX server provider.
 */
class XYZServer {
  /**
   * Constructor.
   *
   * @implements {IDataProvider}
   */
  constructor() {
    /**
     * The logger.
     * @const
     * @type {Logger}
     * @private
     */
    this.log_ = log.getLogger('plugin.xyz.XYZServer');

    /**
     * The XYZ server type.
     * @type {string}
     * @const
     */
    this.providerType = 'xyzserver';

    /**
     * @type {RegExp}
     * @const
     */
    // this.URI_REGEXP = /\/(geoserver|.*?gs)(\/|(\/.*)?\/(ows|web)\/?)?([?#]|$)/i;

    osImplements(plugin.xyz.XYZServer, IDataProvider.ID);
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    this.init();
    this.setLabel(/** @type {string} */ (config['label']));
    this.setEnabled(/** @type {boolean} */ (config['enabled']));
    this.setEditable(/** @type {boolean} */ (config['editable']));

    // var url = /** @type {string} */ (config['url']);
    // this.setWmsUrl(url);
    // this.setOriginalWmsUrl(url);
    // this.setWfsUrl(url);
    // this.setOriginalWfsUrl(url);

    // this.setWmsTimeFormat(/** @type {string} */ (config['wmsTimeFormat']) || '{start}/{end}');
    // this.setWmsDateFormat(/** @type {string} */ (config['wmsDateFormat']) || 'YYYY-MM-DDTHH:mm:ss[Z]');
  }
}


exports = XYZServer;
