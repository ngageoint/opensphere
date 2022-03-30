goog.declareModuleId('os.interaction.DragAndDrop');

import Interaction from 'ol/src/interaction/Interaction.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import * as dispatcher from '../dispatcher.js';
import {createFromFile} from '../file/index.js';
import ImportEvent from '../ui/im/importevent.js';
import ImportEventType from '../ui/im/importeventtype.js';

const {assert} = goog.require('goog.asserts');
const dispose = goog.require('goog.dispose');
const googEvents = goog.require('goog.events');
const FileDropHandler = goog.require('goog.events.FileDropHandler');
const EventType = goog.require('goog.events.FileDropHandler.EventType');
const {TRUE} = goog.require('goog.functions');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * Handles input of vector data by drag and drop.
 */
export default class DragAndDrop extends Interaction {
  /**
   * Constructor.
   */
  constructor() {
    super({
      handleEvent: TRUE
    });

    /**
     * @private
     * @type {FileDropHandler}
     */
    this.fileDropHandler_ = null;

    /**
     * @private
     * @type {googEvents.Key|undefined}
     */
    this.dropListenKey_ = undefined;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.dropListenKey_ !== undefined) {
      googEvents.unlistenByKey(this.dropListenKey_);
    }
    super.disposeInternal();
  }

  /**
   * @param {googEvents.BrowserEvent} event Event.
   * @private
   */
  handleDrop_(event) {
    var files = event.getBrowserEvent().dataTransfer.files;
    var i;
    var ii;
    var file;
    for (i = 0, ii = files.length; i < ii; ++i) {
      file = files[i];

      var reader = createFromFile(file);
      if (reader) {
        reader.addCallbacks(this.handleResult_, this.handleError_, this);
      }
    }
  }

  /**
   * @param {OSFile} file File.
   * @private
   */
  handleResult_(file) {
    var event = new ImportEvent(ImportEventType.FILE, file);
    dispatcher.getInstance().dispatchEvent(event);
  }

  /**
   * @param {string} errorMsg
   * @private
   */
  handleError_(errorMsg) {
    if (errorMsg && typeof errorMsg === 'string') {
      log.error(logger, errorMsg);
      AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
    }
  }

  /**
   * @inheritDoc
   */
  setMap(map) {
    if (this.dropListenKey_ !== undefined) {
      googEvents.unlistenByKey(this.dropListenKey_);
      this.dropListenKey_ = undefined;
    }
    if (this.fileDropHandler_ !== null) {
      dispose(this.fileDropHandler_);
      this.fileDropHandler_ = null;
    }
    assert(this.dropListenKey_ === undefined);
    super.setMap(map);
    if (map !== null) {
      this.fileDropHandler_ = new FileDropHandler(map.getViewport());
      this.dropListenKey_ = googEvents.listen(this.fileDropHandler_, EventType.DROP, this.handleDrop_, false, this);
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.interaction.DragAndDrop');
