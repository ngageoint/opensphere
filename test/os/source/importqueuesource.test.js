goog.require('os.mock');
goog.require('os.im.AsyncImporter');
goog.require('os.mock');
goog.require('os.source.ImportQueue');


describe('os.source.ImportQueue', function() {
  it('lets the importer fully complete before parsing the next queue item', function() {
    var queue1 = ['a', 'b', 'c'];
    var queue2 = [1, 2, 3];
    var queue3 = ['do', 're', 'me'];

    var im = new os.im.AsyncImporter();
    var source = new os.source.ImportQueue();
    source.setImporter(im);

    var spyObj = spyOn(im, 'onParsingComplete');
    var spyCalls = 0;

    spyObj.andCallFake(function() {
      // make sure the source hasn't been cleared
      expect(im.source).not.toBeNull();
      expect(im.source.length).toBe(3);

      // call the original function to dispatch the complete event
      spyObj.originalValue.call(im);
      spyCalls += 1;
    });

    // insert a few items without triggering queue processing, then add a third that will start processing
    source.importQueue_.push(queue1, queue2);
    source.queueData(queue3);

    // wait for the queue to clear or our spy may be called after the spec is disposed
    waitsFor(function() {
      return source.importQueue_.length == 0 && spyCalls == 3;
    }, 'queue to finish processing');
  });
});
