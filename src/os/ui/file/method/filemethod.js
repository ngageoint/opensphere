goog.declareModuleId('os.ui.file.method.FileMethod');

import * as osWindow from '../../window.js';
import windowSelector from '../../windowselector.js';
import {directiveTag as fileImportUi} from '../fileimport.js';

const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('os.events.EventType');
const IFileMethod = goog.require('os.file.IFileMethod'); // eslint-disable-line


/**
 * @implements {IFileMethod}
 */
export default class FileMethod extends EventTarget {
  /**
   * Constructor.
   * @param {boolean=} opt_keepFile Whether the file method will keep the original File reference around.
   *                                This is necessary when the content type of the file is needed (i.e. when uploading
   *                                it to a server).
   */
  constructor(opt_keepFile) {
    super();

    /**
     * @type {os.file.File}
     * @private
     */
    this.file_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.keepFile_ = Boolean(opt_keepFile);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.clearFile();
  }

  /**
   * @inheritDoc
   */
  getPriority() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  isSupported() {
    return Modernizr.indexeddb == true;
  }

  /**
   * @inheritDoc
   */
  getFile() {
    return this.file_;
  }

  /**
   * @inheritDoc
   */
  setFile(file) {
    this.file_ = file;
  }

  /**
   * @inheritDoc
   */
  clearFile() {
    this.file_ = null;
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
   * @return {boolean}
   */
  getKeepFile() {
    return this.keepFile_;
  }

  /**
   * @param {boolean} val
   */
  setKeepFile(val) {
    this.keepFile_ = val;
  }

  /**
   * @inheritDoc
   */
  loadFile(opt_options) {
    if (!this.file_) {
      var scopeOptions = {
        'method': this
      };
      var windowOptions = {
        'label': 'Import File',
        'icon': 'fa fa-floppy-o',
        'x': 'center',
        'y': 'center',
        'width': '400',
        'min-width': '400',
        'max-width': '400',
        'height': 'auto',
        'min-height': '225',
        'modal': 'true',
        'show-close': 'true'
      };
      var template = `<${fileImportUi}></${fileImportUi}>`;
      osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);

      // wait for the window to open before clicking the file input. for whatever reason this doesn't work inside
      // the controller constructor (even on a timeout) the first time the directive is compiled but does work every
      // other time. putting it here always works. the delay allows IE compile/display the import dialog since IE will
      // pause the application while a file browser is open.
      var tries = 0;
      var tryClick = function() {
        tries++;

        if (tries < 10) {
          var fileEl =
              document.getElementById(windowSelector.CONTAINER.substring(1)).querySelector('input[id="fileImportId"]');
          if (fileEl) {
            fileEl.click();
          } else {
            setTimeout(tryClick, 100);
          }
        }
      };
      setTimeout(tryClick, 100);
    } else {
      this.dispatchEvent(EventType.COMPLETE);
    }
  }
}
