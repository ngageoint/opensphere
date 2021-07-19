goog.require('os.Dispatcher');
goog.require('os.data.DataManager');
goog.require('os.data.FileDescriptor');
goog.require('os.file.FileUrlHandler');
goog.require('os.mock');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');


describe('os.file.FileUrlHandler', function() {
  const Dispatcher = goog.module.get('os.Dispatcher');
  const DataManager = goog.module.get('os.data.DataManager');
  const FileDescriptor = goog.module.get('os.data.FileDescriptor');
  const FileUrlHandler = goog.module.get('os.file.FileUrlHandler');
  const ImportEvent = goog.module.get('os.ui.im.ImportEvent');
  const ImportEventType = goog.module.get('os.ui.im.ImportEventType');

  var handler;
  var url = 'https://file.com/file.csv';

  beforeEach(function() {
    handler = new FileUrlHandler();
  });

  it('should handle only file keys', function() {
    expect(handler.handles('file')).toBe(true);
    expect(handler.handles('fiel')).toBe(false);
  });

  it('should handle keys by firing an import event', function() {
    var received;
    var fn = function(event) {
      received = event;
    };
    Dispatcher.getInstance().listenOnce(ImportEventType.URL, fn);

    handler.handle('file', url);

    expect(received).not.toBe(undefined);
    expect(received instanceof ImportEvent);
    expect(received.url).toBe(url);
  });

  it('should unhandle keys by removing the corresponding descriptor', function() {
    var d = new FileDescriptor();
    d.setId('muhId');
    d.setUrl(url);

    DataManager.getInstance().addDescriptor(d);
    expect(DataManager.getInstance().getDescriptor('muhId')).not.toBe(null);

    handler.handle('file', url);
    handler.handle('file', '');

    expect(DataManager.getInstance().getDescriptor('muhId')).toBe(null);
  });
});
