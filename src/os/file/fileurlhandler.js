goog.provide('os.file.FileUrlHandler');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.url.AbstractUrlHandler');



/**
 * Handles URL parameters for files.
 * @extends {os.url.AbstractUrlHandler}
 * @constructor
 */
os.file.FileUrlHandler = function() {
  os.file.FileUrlHandler.base(this, 'constructor');
  this.keys = [os.file.FileUrlHandler.KEY];
};
goog.inherits(os.file.FileUrlHandler, os.url.AbstractUrlHandler);
goog.addSingletonGetter(os.file.FileUrlHandler);


/**
 * @type {string}
 * @const
 */
os.file.FileUrlHandler.KEY = 'file';


/**
 * Handles a file by kicking off the import process.
 * @inheritDoc
 */
os.file.FileUrlHandler.prototype.handleInternal = function(key, value) {
  if (key === os.file.FileUrlHandler.KEY) {
    var d = os.dataManager.getDescriptorByUrl(value);

    // check if it exists
    if (d) {
      if (!d.isActive()) {
        // turn it on if it's off
        d.setActive(true);
      }
      // don't send another import event
      return;
    }

    var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL, value);
    os.dispatcher.dispatchEvent(event);
  }
};


/**
 * Unhandles a file by removing the descriptor.
 * @inheritDoc
 */
os.file.FileUrlHandler.prototype.unhandleInternal = function(key, value) {
  if (key === os.file.FileUrlHandler.KEY) {
    var d = null;
    var descriptors = os.dataManager.getDescriptors();
    for (var i = 0, ii = descriptors.length; i < ii; i++) {
      if (descriptors[i].matchesURL(value)) {
        d = descriptors[i];
        break;
      }
    }

    if (d) {
      d.setActive(false);
      os.dataManager.removeDescriptor(d);
    }
  }
};
