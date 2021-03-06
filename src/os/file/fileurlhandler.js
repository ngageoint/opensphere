goog.module('os.file.FileUrlHandler');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const DataManager = goog.require('os.data.DataManager');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const AbstractUrlHandler = goog.require('os.url.AbstractUrlHandler');


/**
 * Handles URL parameters for files.
 */
class FileUrlHandler extends AbstractUrlHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.keys = [FileUrlHandler.KEY];
  }

  /**
   * Handles a file by kicking off the import process.
   *
   * @inheritDoc
   */
  handleInternal(key, value) {
    if (key === FileUrlHandler.KEY) {
      var d = DataManager.getInstance().getDescriptorByUrl(value);

      // check if it exists
      if (d) {
        if (!d.isActive()) {
          // turn it on if it's off
          d.setActive(true);
        }
        // don't send another import event
        return;
      }

      var event = new ImportEvent(ImportEventType.URL, value);
      dispatcher.getInstance().dispatchEvent(event);
    }
  }

  /**
   * Unhandles a file by removing the descriptor.
   *
   * @inheritDoc
   */
  unhandleInternal(key, value) {
    if (key === FileUrlHandler.KEY) {
      var d = null;
      var descriptors = DataManager.getInstance().getDescriptors();
      for (var i = 0, ii = descriptors.length; i < ii; i++) {
        if (descriptors[i].matchesURL(value)) {
          d = descriptors[i];
          break;
        }
      }

      if (d) {
        d.setActive(false);
        DataManager.getInstance().removeDescriptor(d);
      }
    }
  }
}
goog.addSingletonGetter(FileUrlHandler);


/**
 * @type {string}
 * @const
 */
FileUrlHandler.KEY = 'file';


exports = FileUrlHandler;
