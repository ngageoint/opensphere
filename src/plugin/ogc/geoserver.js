goog.module('plugin.ogc.GeoServer');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const IDataProvider = goog.require('os.data.IDataProvider');
const osImplements = goog.require('os.implements');
const OGCServer = goog.require('os.ui.ogc.OGCServer');
const Logger = goog.requireType('goog.log.Logger');


/**
 * The GeoServer server provider.
 *
 * @implements {IDataProvider}
 */
class GeoServer extends OGCServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
    this.providerType = GeoServer.TYPE;
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    this.init();
    this.setLabel(/** @type {string} */ (config['label']));
    this.setEnabled(/** @type {boolean} */ (config['enabled']));
    this.setEditable(/** @type {boolean} */ (config['editable']));

    var url = /** @type {string} */ (config['url']);
    this.setWmsUrl(url);
    this.setOriginalWmsUrl(url);
    this.setWfsUrl(url);
    this.setOriginalWfsUrl(url);

    this.setWmsTimeFormat(/** @type {string} */ (config['wmsTimeFormat']) || '{start}/{end}');
    this.setWmsDateFormat(/** @type {string} */ (config['wmsDateFormat']) || 'YYYY-MM-DDTHH:mm:ss[Z]');

    var wfsContentType = /** @type {string|undefined} */ (config['wfsContentType']);
    if (wfsContentType) {
      this.setWfsContentType(wfsContentType);
    }
  }
}
osImplements(GeoServer, IDataProvider.ID);

/**
 * The GeoServer server type.
 * @type {string}
 * @const
 */
GeoServer.TYPE = 'geoserver';

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.ogc.GeoServer');

/**
 * @type {RegExp}
 * @const
 */
GeoServer.URI_REGEXP = /\/(geoserver|.*?gs)(\/|(\/.*)?\/(ows|web)\/?)?([?#]|$)/i;

exports = GeoServer;
