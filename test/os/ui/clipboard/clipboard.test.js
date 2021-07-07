goog.require('os.ui.clipboard');

// These API's are only present in newer versions of Chrome. Firefox does not have full support for the Clipboard API.
xdescribe('os.ui.clipboard', function() {
  const {getData} = goog.module.get('os.ui.clipboard');

  it('should retrieve clipboard data from event', function() {
    const contentType = 'text/plain';
    const expected = 'unit test clipboard data';

    const clipboardData = new DataTransfer();
    clipboardData.setData(contentType, expected);

    const event = new ClipboardEvent('paste', {clipboardData});

    expect(getData(event, contentType)).toBe(expected);
  });
});
