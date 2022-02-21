goog.declareModuleId('plugin.ogc.GeoServer');

import IDataProvider from '../../os/data/idataprovider.js';
import osImplements from '../../os/implements.js';
import OGCServer from '../../os/ui/ogc/ogcserver.js';

const log = goog.require('goog.log');

/**
 * The GeoServer server provider.
 *
 * @implements {IDataProvider}
 */
export default class GeoServer extends OGCServer {
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

  /**
   * The server type.
   * @type {string}
   * @override
   */
  static get TYPE() {
    return 'geoserver';
  }
}

osImplements(GeoServer, IDataProvider.ID);

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
