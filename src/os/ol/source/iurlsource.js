goog.provide('os.ol.source.IUrlSource');



/**
 * Interface for openlayers sources supporting changing URLs and request parameters.
 * @interface
 */
os.ol.source.IUrlSource = function() {};


/**
 * Identifier for {@link os.implements}.
 * @type {string}
 */
os.ol.source.IUrlSource.ID = 'os.ol.source.IUrlSource';


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 */
os.ol.source.IUrlSource.prototype.getParams;


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 */
os.ol.source.IUrlSource.prototype.updateParams;


/**
 * Return the URLs used for this source. When a tileUrlFunction is used instead of url or urls, null will be returned.
 * @return {!Array<string>|null} URLs.
 */
os.ol.source.IUrlSource.prototype.getUrls;


/**
 * Set the URL to use for requests.
 * @param {string} url URL.
 */
os.ol.source.IUrlSource.prototype.setUrl;


/**
 * Set the URLs to use for requests.
 * @param {Array<string>} urls URLs.
 */
os.ol.source.IUrlSource.prototype.setUrls;
