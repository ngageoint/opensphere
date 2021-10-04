goog.declareModuleId('os.ui.im.ImportEvent');

import OSFile from '../../file/file.js';

const GoogEvent = goog.require('goog.events.Event');


/**
 * File/URL import event.
 */
export default class ImportEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {(OSFile|string)=} opt_fileOrUrl
   * @param {string=} opt_contentHint
   * @param {Object=} opt_config Optional config, giving context to the import process
   */
  constructor(type, opt_fileOrUrl, opt_contentHint, opt_config) {
    super(type);

    /**
     * @type {?string}
     */
    this.contentHint = opt_contentHint ? opt_contentHint : null;

    /**
     * @type {?OSFile}
     */
    this.file = opt_fileOrUrl && opt_fileOrUrl instanceof OSFile ? opt_fileOrUrl : null;

    /**
     * @type {?string}
     */
    this.url = opt_fileOrUrl && typeof opt_fileOrUrl === 'string' ? opt_fileOrUrl : null;

    /**
     * @type {?Object}
     */
    this.config = opt_config || null;
  }
}
