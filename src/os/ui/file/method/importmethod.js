goog.declareModuleId('os.ui.file.method.ImportMethod');

import EventType from '../../../events/eventtype.js';
import ImportManager from '../../im/importmanager.js';
import * as osWindow from '../../window.js';
import {directiveTag as importUi} from '../importdialog.js';
import UrlMethod from './urlmethod.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Import method handling both local files and URL's.
 */
export default class ImportMethod extends UrlMethod {
  /**
   * Constructor.
   * @param {boolean=} opt_keepFile Whether the file method will keep the original File reference around
   */
  constructor(opt_keepFile) {
    super();
    this.log = logger;

    /**
     * If the File reference should be saved on the {@link os.file.File} instance.
     * @type {boolean}
     * @private
     */
    this.keepFile_ = Boolean(opt_keepFile);
  }

  /**
   * @inheritDoc
   */
  getPriority() {
    return 100;
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = new this.constructor();
    other.setKeepFile(this.getKeepFile());
    return other;
  }

  /**
   * If the File reference should be saved on the {@link os.file.File} instance.
   *
   * @return {boolean}
   */
  getKeepFile() {
    return this.keepFile_;
  }

  /**
   * Set if the File reference should be saved on the {@link os.file.File} instance.
   *
   * @param {boolean} val
   */
  setKeepFile(val) {
    this.keepFile_ = val;
  }

  /**
   * @inheritDoc
   */
  loadFile(opt_options) {
    var file = this.getFile();
    var url = this.getUrl();
    if (!file && !url) {
      var scopeOptions = {
        'manager': opt_options && opt_options['manager'] || ImportManager.getInstance(),
        'method': this
      };

      var windowOptions = {
        'id': UrlMethod.ID,
        'label': 'Import Data',
        'icon': 'fa fa-cloud-download',
        'x': 'center',
        'y': 'center',
        'width': '400',
        'min-width': '400',
        'max-width': '400',
        'height': 'auto',
        'modal': 'true',
        'show-close': 'true'
      };

      var template = `<${importUi} manager="manager" method="method"></${importUi}>`;
      osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
    } else if (url) {
      this.loadUrl();
    } else if (file) {
      this.dispatchEvent(EventType.COMPLETE);
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.method.ImportMethod');
