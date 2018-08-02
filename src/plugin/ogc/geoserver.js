goog.provide('plugin.ogc.GeoServer');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string.path');
goog.require('os.data.IDataProvider');
goog.require('os.ui.ogc.OGCServer');



/**
 * The GeoFusebox server provider
 *
 * @implements {os.data.IDataProvider}
 * @extends {os.ui.ogc.OGCServer}
 * @constructor
 */
plugin.ogc.GeoServer = function() {
  plugin.ogc.GeoServer.base(this, 'constructor');
  this.log = plugin.ogc.GeoServer.LOGGER_;
  this.providerType = plugin.ogc.GeoServer.TYPE;
};
goog.inherits(plugin.ogc.GeoServer, os.ui.ogc.OGCServer);


/**
 * The GeoServer server type.
 * @type {string}
 * @const
 */
plugin.ogc.GeoServer.TYPE = 'geoserver';


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.ogc.GeoServer.LOGGER_ = goog.log.getLogger('plugin.ogc.GeoServer');


/**
 * @inheritDoc
 */
plugin.ogc.GeoServer.prototype.configure = function(config) {
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
};


/**
 * @type {RegExp}
 * @const
 * @private
 */
plugin.ogc.GeoServer.URI_REGEXP_ = /\/(geoserver|.*?gs)(\/|(\/.*)?\/(ows|web)\/?)?([?#]|$)/i;


/**
 * @param {os.file.File} file
 * @return {number}
 */
plugin.ogc.GeoServer.isGeoserverResponse = function(file) {
  var score = 0;

  if (file) {
    var uri = file.getUrl();

    if (uri) {
      score += plugin.ogc.GeoServer.URI_REGEXP_.test(uri) ? 5 : 0;
    }
  }

  return score;
};
