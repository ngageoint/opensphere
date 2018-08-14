goog.provide('os.net.IDataFormatter');



/**
 * Data formatters take the parameters (or any other part of) the URI and create the payload for the request.
 * @interface
 */
os.net.IDataFormatter = function() {};


/**
 * Get the content type for the format.
 * @return {string} The content type (e.g. <code>'text/xml'</code>)
 */
os.net.IDataFormatter.prototype.getContentType;


/**
 * Creates the payload from the given parameters.
 * @param {goog.Uri} uri The URI for the request
 * @return {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)} The request payload
 */
os.net.IDataFormatter.prototype.format;
