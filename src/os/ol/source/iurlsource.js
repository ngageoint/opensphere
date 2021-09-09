goog.module('os.ol.source.IUrlSource');


/**
 * Interface for openlayers sources supporting changing URLs and request parameters.
 *
 * @interface
 */
class IUrlSource {
  /**
   * Get the user-provided params, i.e. those passed to the constructor through
   * the "params" option, and possibly updated using the updateParams method.
   * @return {Object} Params.
   */
  getParams() {}

  /**
   * Update the user-provided params.
   * @param {Object} params Params.
   */
  updateParams(params) {}

  /**
   * Return the URLs used for this source. When a tileUrlFunction is used instead of url or urls, null will be returned.
   * @return {!Array<string>|null} URLs.
   */
  getUrls() {}

  /**
   * Set the URL to use for requests.
   * @param {string} url URL.
   */
  setUrl(url) {}

  /**
   * Set the URLs to use for requests.
   * @param {Array<string>} urls URLs.
   */
  setUrls(urls) {}
}

/**
 * Identifier for {@link os.implements}.
 * @type {string}
 */
IUrlSource.ID = 'os.ol.source.IUrlSource';

exports = IUrlSource;
