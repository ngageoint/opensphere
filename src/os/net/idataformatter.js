goog.declareModuleId('os.net.IDataFormatter');

/**
 * Data formatters take the parameters (or any other part of) the URI and create the payload for the request.
 *
 * @interface
 */
export default class IDataFormatter {
  /**
   * Get the content type for the format.
   * @return {string} The content type (e.g. <code>'text/xml'</code>)
   */
  getContentType() {}

  /**
   * Creates the payload from the given parameters.
   * @param {goog.Uri} uri The URI for the request
   * @return {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)} The request payload
   */
  format(uri) {}
}
