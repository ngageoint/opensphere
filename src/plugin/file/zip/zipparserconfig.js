goog.module('plugin.file.zip.ZIPParserConfig');
goog.module.declareLegacyNamespace();

const FileParserConfig = goog.require('os.parse.FileParserConfig');


/**
 * Configuration for a ZIP parser.
 * @unrestricted
 */
class ZIPParserConfig extends FileParserConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {number}
     */
    this['status'] = -1;

    /**
     * The destination where ZIPParser drops the unzipped files
     * @type {Array.<osx.import.FileWrapper>}
     */
    this['files'] = [];
  }

  /**
   * Helper function to clean up memory if the parser is taking too long, user cancels/abandons the thread, etc
   * @public
   */
  cleanup() {
    this['file'] = null;
    if (this['files'].length > 0) this['files'] = [];
    this['status'] = -1; // uninitialized state
  }
}

exports = ZIPParserConfig;
