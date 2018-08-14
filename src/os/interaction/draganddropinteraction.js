goog.provide('os.interaction.DragAndDrop');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.FileDropHandler.EventType');
goog.require('goog.functions');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.interaction.Interaction');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.file.FileManager');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');



/**
 * Handles input of vector data by drag and drop.
 * @extends {ol.interaction.Interaction}
 * @constructor
 */
os.interaction.DragAndDrop = function() {
  os.interaction.DragAndDrop.base(this, 'constructor', {
    handleEvent: goog.functions.TRUE
  });

  /**
   * @private
   * @type {goog.events.FileDropHandler}
   */
  this.fileDropHandler_ = null;

  /**
   * @private
   * @type {goog.events.Key|undefined}
   */
  this.dropListenKey_ = undefined;
};
goog.inherits(os.interaction.DragAndDrop, ol.interaction.Interaction);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.interaction.DragAndDrop.LOGGER_ = goog.log.getLogger('os.interaction.DragAndDrop');


/**
 * @inheritDoc
 */
os.interaction.DragAndDrop.prototype.disposeInternal = function() {
  if (goog.isDef(this.dropListenKey_)) {
    goog.events.unlistenByKey(this.dropListenKey_);
  }
  os.interaction.DragAndDrop.base(this, 'disposeInternal');
};


/**
 * @param {goog.events.BrowserEvent} event Event.
 * @private
 */
os.interaction.DragAndDrop.prototype.handleDrop_ = function(event) {
  var files = event.getBrowserEvent().dataTransfer.files;
  var i;
  var ii;
  var file;
  for (i = 0, ii = files.length; i < ii; ++i) {
    file = files[i];

    var reader = os.file.createFromFile(file);
    if (reader) {
      reader.addCallbacks(this.handleResult_, this.handleError_, this);
    }
  }
};


/**
 * @param {os.file.File} file File.
 * @private
 */
os.interaction.DragAndDrop.prototype.handleResult_ = function(file) {
  var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, file);
  os.dispatcher.dispatchEvent(event);
};


/**
 * @param {string} errorMsg
 * @private
 */
os.interaction.DragAndDrop.prototype.handleError_ = function(errorMsg) {
  if (errorMsg && goog.isString(errorMsg)) {
    goog.log.error(os.interaction.DragAndDrop.LOGGER_, errorMsg);
    os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
  }
};


/**
 * @inheritDoc
 */
os.interaction.DragAndDrop.prototype.setMap = function(map) {
  if (goog.isDef(this.dropListenKey_)) {
    goog.events.unlistenByKey(this.dropListenKey_);
    this.dropListenKey_ = undefined;
  }
  if (!goog.isNull(this.fileDropHandler_)) {
    goog.dispose(this.fileDropHandler_);
    this.fileDropHandler_ = null;
  }
  goog.asserts.assert(!goog.isDef(this.dropListenKey_));
  os.interaction.DragAndDrop.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    this.fileDropHandler_ = new goog.events.FileDropHandler(map.getViewport());
    this.dropListenKey_ = goog.events.listen(
        this.fileDropHandler_, goog.events.FileDropHandler.EventType.DROP,
        this.handleDrop_, false, this);
  }
};
