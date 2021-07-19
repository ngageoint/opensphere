goog.module('os.ui.ogc.IOGCDescriptor');
goog.module.declareLegacyNamespace();

const IWMSLayer = goog.require('os.ui.ogc.wms.IWMSLayer'); // eslint-disable-line

const QueryData = goog.requireType('goog.Uri.QueryData');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const IServerDescriptor = goog.requireType('os.data.IServerDescriptor');
const IFilterable = goog.requireType('os.filter.IFilterable');
const IFeatureTypeDescriptor = goog.requireType('os.ui.ogc.IFeatureTypeDescriptor');

/**
 * Interface for OGC data descriptors.
 *
 * @interface
 * @extends {IDataDescriptor}
 * @extends {IServerDescriptor}
 * @extends {IFilterable}
 * @extends {IFeatureTypeDescriptor}
 * @extends {IWMSLayer}
 */
class IOGCDescriptor {
  /**
   * @param {?function()} fn The callback to call when the DescribeFeatureType completes.
   */
  setDescribeCallback(fn) {}

  /**
   * If WFS is enabled.
   * @return {boolean}
   */
  isWfsEnabled() {}

  /**
   * Set if WFS is enabled.
   * @param {boolean} value
   */
  setWfsEnabled(value) {}

  /**
   * Get the WFS type name.
   * @return {?string}
   */
  getWfsName() {}

  /**
   * Set the WFS type name.
   * @param {?string} value
   */
  setWfsName(value) {}

  /**
   * Get the WFS namespace.
   * @return {?string}
   */
  getWfsNamespace() {}

  /**
   * Set the WFS namespace.
   * @param {?string} value
   */
  setWfsNamespace(value) {}

  /**
   * Get the WFS URL.
   * @return {?string}
   */
  getWfsUrl() {}

  /**
   * Set the WFS URL.
   * @param {?string} value
   */
  setWfsUrl(value) {}

  /**
   * Get the content type used for WFS requests.
   * @return {string} The content type.
   */
  getWfsContentType() {}

  /**
   * Set the content type used for WFS requests.
   * @param {string} value The content type.
   */
  setWfsContentType(value) {}

  /**
   * Get the list of WFS output formats
   * @return {?Array<string>} formats
   */
  getWfsFormats() {}

  /**
   * Set the list of WFS output formats
   * @param {?Array<string>} value
   */
  setWfsFormats(value) {}

  /**
   * If WMS is enabled.
   * @return {boolean}
   */
  isWmsEnabled() {}

  /**
   * Set if WMS is enabled.
   * @param {boolean} value
   */
  setWmsEnabled(value) {}

  /**
   * @return {!string} The WMS version
   */
  getWmsVersion() {}

  /**
   * @param {?string} value The WMS version
   */
  setWmsVersion(value) {}

  /**
   * Get the date format for WMS requests.
   * @return {?string}
   */
  getWmsDateFormat() {}

  /**
   * Set the date format for WMS requests.
   * @param {?string} value
   */
  setWmsDateFormat(value) {}

  /**
   * Get the additional WMS parameters to include in requests.
   * @return {?QueryData}
   */
  getWmsParams() {}

  /**
   * Set the additional WMS parameters to include in requests.
   * @param {?QueryData} value
   */
  setWmsParams(value) {}

  /**
   * Get the additional WFS parameters to include in requests
   * @return {?QueryData}
   */
  getWfsParams() {}

  /**
   * Set the additional WFS parameters to include in requests
   * @param {?QueryData} value
   */
  setWfsParams(value) {}

  /**
   * Get the WMS type name.
   * @return {?string}
   */
  getWmsName() {}

  /**
   * Set the WMS type name.
   * @param {?string} value
   */
  setWmsName(value) {}

  /**
   * Get the time format for WMS requests.
   * @return {?string}
   */
  getWmsTimeFormat() {}

  /**
   * Set the time format for WMS requests.
   * @param {?string} value
   */
  setWmsTimeFormat(value) {}

  /**
   * Get the WMS URL.
   * @return {?string}
   */
  getWmsUrl() {}

  /**
   * Set the WMS URL.
   * @param {?string} value
   */
  setWmsUrl(value) {}

  /**
   * If WMTS is enabled.
   * @return {boolean}
   */
  isWmtsEnabled() {}

  /**
   * Set if WMTS is enabled.
   * @param {boolean} value
   */
  setWmtsEnabled(value) {}

  /**
   * Get the date format for WMTS requests.
   * @return {?string}
   */
  getWmtsDateFormat() {}

  /**
   * Set the date format for WMTS requests.
   * @param {?string} value
   */
  setWmtsDateFormat(value) {}

  /**
   * Get the WMTS options.
   * @return {Array<olx.source.WMTSOptions>}
   */
  getWmtsOptions() {}

  /**
   * Set the WMTS options.
   * @param {Array<olx.source.WMTSOptions>} value
   */
  setWmtsOptions(value) {}

  /**
   * Get the time format for WMTS requests.
   * @return {?string}
   */
  getWmtsTimeFormat() {}

  /**
   * Set the time format for WMTS requests.
   * @param {?string} value
   */
  setWmtsTimeFormat(value) {}

  /**
   * Get if requests should use POST instead of GET.
   * @return {boolean}
   */
  getUsePost() {}

  /**
   * Set if requests should use POST instead of GET.
   * @param {boolean} value
   */
  setUsePost(value) {}

  /**
   * @return {?string}
   */
  getLayerName() {}

  /**
   * @return {?string}
   * @deprecated Use IFilterable.getFilterKey()
   */
  getUrlKey() {}

  /**
   * Get deprecated
   * @return {boolean}
   */
  getDeprecated() {}

  /**
   * Set deprecated
   * @param {boolean} value
   */
  setDeprecated(value) {}
}

/**
 * @type {string}
 * @const
 */
IOGCDescriptor.ID = 'os.ui.ogc.IOGCDescriptor';

exports = IOGCDescriptor;
