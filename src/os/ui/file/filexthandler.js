goog.declareModuleId('os.ui.file.FileXTHandler');

import * as dispatcher from '../../dispatcher.js';
import FileStorage from '../../file/filestorage.js';
import {FileScheme} from '../../file/index.js';
import {SHARED_DB_VERSION, SHARED_FILE_DB_NAME} from '../../os.js';
import ImportEvent from '../im/importevent.js';
import ImportEventType from '../im/importeventtype.js';
import NotificationManager from '../notification/notificationmanager.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: IMessageHandler} = goog.requireType('os.xt.IMessageHandler');


/**
 * Handles file load messages from other applications
 *
 * @implements {IMessageHandler}
 */
export default class FileXTHandler {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  getTypes() {
    return [
      FileXTHandler.TYPE
    ];
  }

  /**
   * @inheritDoc
   */
  process(data, type, sender, time) {
    const url = /** @type {string} */ (data.url);

    if (type === FileXTHandler.TYPE) {
      if (url.startsWith(FileScheme.LOCAL + '://')) { // local file
        const fs = new FileStorage(SHARED_FILE_DB_NAME, SHARED_DB_VERSION); // read into memory
        fs.getFile(url).addCallbacks(this.onFileReady_, this.onFileError_, this); // local file handler??
      } else {
        const importEvent = new ImportEvent(ImportEventType.URL, url, undefined,
            /** @type {!Object} */ (data));
        dispatcher.getInstance().dispatchEvent(importEvent);
        NotificationManager.getInstance().increment();
      }
    }
  }

  /**
   * @param {!OSFile} file
   * @private
   */
  onFileReady_(file) {
    var fs = new FileStorage(SHARED_FILE_DB_NAME, SHARED_DB_VERSION);
    fs.deleteFile(file); // delete indexdb version
    var importEvent = new ImportEvent(ImportEventType.FILE, file);
    dispatcher.getInstance().dispatchEvent(importEvent);
    NotificationManager.getInstance().increment();
  }

  /**
   * @param {*} error
   * @private
   */
  onFileError_(error) {
    var errors = [];
    var statusCode;

    if (typeof error === 'string') {
      statusCode = 400;
      errors.push(/** @type {string} */ (error));
    } else {
      statusCode = 404;
      errors.push('File not found in local storage!');
    }

    log.error(logger, errors.toString() + ' Status code: ' + statusCode);
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.FileXTHandler');

/**
 * @type {string}
 * @const
 */
FileXTHandler.TYPE = 'file.load';
