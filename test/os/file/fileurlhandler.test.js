goog.require('os.data.FileDescriptor');
goog.require('os.file.FileUrlHandler');
goog.require('os.mock');
goog.require('os.ui.im.ImportEvent');


describe('os.file.FileUrlHandler', function() {
  var handler;
  var url = 'https://file.com/file.csv';

  beforeEach(function() {
    handler = new os.file.FileUrlHandler();
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
    os.dispatcher.listenOnce(os.ui.im.ImportEventType.URL, fn);

    handler.handle('file', url);

    expect(received).not.toBe(undefined);
    expect(received instanceof os.ui.im.ImportEvent);
    expect(received.url).toBe(url);
  });

  it('should unhandle keys by removing the corresponding descriptor', function() {
    var d = new os.data.FileDescriptor();
    d.setId('muhId');
    d.setUrl(url);

    os.dataManager.addDescriptor(d);
    expect(os.dataManager.getDescriptor('muhId')).not.toBe(null);

    handler.handle('file', url);
    handler.handle('file', '');

    expect(os.dataManager.getDescriptor('muhId')).toBe(null);
  });
});
