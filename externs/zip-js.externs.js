/* eslint-disable */
/**
 * @fileoverview Externs for zip.js.
 * @see {@link http://gildas-lormeau.github.io/zip.js/} For API documentation.
 * @see {@link https://www.npmjs.com/package/zip-js} For npm releases.
 * @externs
 */


/**
 * @type {Object}
 * @const
 */
var zip = {};


/**
 * Create a ZipReader object. A ZipReader object helps to read the zipped content.
 * @param {!zip.Reader} reader The zip.Reader object used to read input data
 * @param {function(!zip.Reader)} success Success callback function returning the new ZipReader object as parameter
 * @param {Function=} opt_error Global error callback function
 */
zip.createReader = function(reader, success, opt_error) {};


/**
 * Create a ZipWriter object. A ZipWriter object helps to write zipped content.
 * @param {!zip.Writer} writer The zip.Writer object used to read input data
 * @param {function(!zip.Writer)} success Success callback function returning the new ZipWriter object as parameter
 * @param {Function=} opt_error Global error callback function
 */
zip.createWriter = function(writer, success, opt_error) {};


/**
 * The relative path of deflate.js and inflate.js files
 * @type {string}
 */
zip.workerScriptsPath;


/**
 * If web workers should be used
 * @type {boolean}
 */
zip.useWebWorkers;



/**
 * Constructor representing a zip file entry.
 * @constructor
 * @return {!zip.Entry}
 */
zip.Entry = function() {};


/**
 * file comment
 * @type {string}
 */
zip.Entry.prototype.comment;


/**
 * uncompressed data checksum
 * @type {number}
 */
zip.Entry.prototype.crc32;


/**
 * compressed data size
 * @type {number}
 */
zip.Entry.prototype.compressedSize;


/**
 * true if the entry is a directory
 * @type {boolean}
 */
zip.Entry.prototype.directory;


/**
 * file name
 * @type {string}
 */
zip.Entry.prototype.filename;


/**
 * last modification date
 * @type {Date}
 */
zip.Entry.prototype.lastModDate;


/**
 * last modification date in raw format (MS-DOS)
 * @type {number}
 */
zip.Entry.prototype.lastModDateRaw;


/**
 * uncompressed data size
 * @type {number}
 */
zip.Entry.prototype.uncompressedSize;


/**
 * @typedef {{
 *   comment: (string|undefined),
 *   directory: (boolean|undefined),
 *   lastModDate: (Date|undefined),
 *   level: (number|undefined),
 *   version: (number|undefined)
 * }}
 */
zip.EntryOptions;


/**
 * File comment
 * @type {string|undefined}
 */
zip.EntryOptions.prototype.comment;


/**
 * If the entry is a directory
 * @type {boolean|undefined}
 */
zip.EntryOptions.prototype.directory;


/**
 * Last modification date
 * @type {Date|undefined}
 */
zip.EntryOptions.prototype.lastModDate;


/**
 * Compression level from 0 to 9
 * @type {number|undefined}
 */
zip.EntryOptions.prototype.level;


/**
 * Zip version
 * @type {number|undefined}
 */
zip.EntryOptions.prototype.version;


/**
 * Progress callback function.
 * @typedef {function(number, number)}
 */
zip.ProgressCallback;


/**
 * Get the data of a zip entry
 * @param {zip.Writer} writer zip.Writer object used to write output data
 * @param {function(*)} onend success callback function returning the output data
 *     (returned type depends on zip.Writer constructor used) as parameter
 * @param {zip.ProgressCallback=} opt_onprogress progress callback function returning the progress index (number)
 *     and a max value (number) as parameters
 * @param {boolean=} opt_checkCrc32 pass true to verify data integrity
 */
zip.Entry.prototype.getData = function(writer, onend, opt_onprogress, opt_checkCrc32) {};



/**
 * Generic object used to read entry data
 * @param {*} content
 * @constructor
 * @return {!zip.Reader}
 */
zip.Reader = function(content) {};


/**
 * Get all entries from a zip.
 * @param {function(Array.<!zip.Entry>)} callback
 */
zip.Reader.prototype.getEntries = function(callback) {};



/**
 * Object used to read entry data from an ArrayBuffer
 * @param {ArrayBuffer} content
 * @extends {zip.Reader}
 * @constructor
 * @return {!zip.ArrayBufferReader}
 */
zip.ArrayBufferReader = function(content) {};



/**
 * Object used to read entry data from a Blob
 * @param {Blob} content
 * @extends {zip.Reader}
 * @constructor
 * @return {!zip.BlobReader}
 */
zip.BlobReader = function(content) {};


/**
 * Object used to read entry data from a string
 * @param {string} content
 * @extends {zip.Reader}
 * @constructor
 * @return {!zip.TextReader}
 */
zip.TextReader = function(content) {};



/**
 * @constructor
 * @return {!zip.Writer.<T>}
 * @template T
 */
zip.Writer = function() {};


/**
 * Add a new entry to the zip.
 * @param {string} fileName The entry file name
 * @param {zip.Reader} reader The reader used to read entry data to add - null for directory entry
 * @param {function()} onend Success callback function
 * @param {zip.ProgressCallback=} opt_onprogress Progress callback function returning the progress index (number)
 *   and a max value (number) as parameters
 * @param {zip.EntryOptions=} opt_options The entry options
 */
zip.Writer.prototype.add = function(fileName, reader, onend, opt_onprogress, opt_options) {};


/**
 * Close the opened zip.
 * @param {function(T)} callback Success callback function returning the generated zip data (returned type depends
 *   on the zip.Writer constructor used) as parameter.
 */
zip.Writer.prototype.close = function(callback) {};



/**
 * ArrayBuffer object writer constructor
 * @extends {zip.Writer.<ArrayBuffer>}
 * @constructor
 * @return {!zip.ArrayBufferWriter}
 */
zip.ArrayBufferWriter = function() {};



/**
 * ArrayBuffer object writer constructor
 * @extends {zip.Writer.<Blob>}
 * @constructor
 * @return {!zip.BlobWriter}
 */
zip.BlobWriter = function() {};



/**
 * DataURI object writer constructor
 * @param {string} mimeType
 * @extends {zip.Writer}
 * @constructor
 * @return {!zip.Data64URIWriter}
 */
zip.Data64URIWriter = function(mimeType) {};



/**
 * Text content writer constructor
 * @extends {zip.Writer.<String>}
 * @constructor
 * @return {!zip.TextWriter}
 */
zip.TextWriter = function() {};
