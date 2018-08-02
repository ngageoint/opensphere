goog.provide('os.file.IContentTypeMethod');



/**
 * @interface
 */
os.file.IContentTypeMethod = function() {};


/**
 * Gets the content type for this method.
 * @return {string}
 */
os.file.IContentTypeMethod.prototype.getContentType;


/**
 * Gets the layer type for this method.
 * @return {string}
 */
os.file.IContentTypeMethod.prototype.getLayerType;


/**
 * Gets the priority of this method. The higher the priority, the earlier the method is tried.
 * @return {number}
 */
os.file.IContentTypeMethod.prototype.getPriority;


/**
 * Detect the content type for the given content.
 * @param {os.file.File} file The file
 * @param {Array.<zip.Entry>=} opt_zipEntries If the file is a zip file, this contains all entries in the file
 * @return {boolean} Whether or not this type represents the file
 */
os.file.IContentTypeMethod.prototype.isType;
