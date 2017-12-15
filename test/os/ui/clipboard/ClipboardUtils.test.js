goog.require('os.ui.clipboard');

// @todo ClipboardEvent is an expermental feature listed MDN docs, but not available in browsers.
// clipboardData is read-only and DataTransfer can not be constructed, so how do we mock a representative event?
xdescribe('os.ui.clipboard', function() {
  it('should retrieve clipboard data from event', function() {
    var event = new ClipboardEvent('paste');
    event.clipboardData.setData('text', 'unit test clipboard data');
    expect(os.ui.clipboard.getData()).toBe('unit test clipboard data');
  });
});
