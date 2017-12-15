goog.require('os.data.BaseDescriptor');
goog.require('os.data.DataManager');
goog.require('os.data.FileDescriptor');
goog.require('os.data.FileProvider');
goog.require('os.mock');

describe('os.data.FileProvider', function() {
  it('should load file descriptors from the data manager', function() {
    var desc1 = new os.data.FileDescriptor();
    desc1.setId('file#one');
    var desc2 = new os.data.FileDescriptor();
    desc2.setId('file#two');
    var desc3 = new os.data.BaseDescriptor();
    desc3.setId('base#one');

    var p = new os.data.FileProvider();
    p.configure({});

    // it should've added three descriptors to the data manager
    var dm = os.dataManager;
    dm.addDescriptor(desc1);
    dm.addDescriptor(desc2);
    dm.addDescriptor(desc3);

    expect(dm.getDescriptor('file#one')).toBeTruthy();
    expect(dm.getDescriptor('file#two')).toBeTruthy();
    expect(dm.getDescriptor('base#one')).toBeTruthy();

    p.load(false);
    expect(p.getChildren().length).toBe(2);
    expect(goog.array.some(p.getChildren(), function(node) {
      return node.getDescriptor() == desc1;
    })).toBe(true);
    expect(goog.array.some(p.getChildren(), function(node) {
      return node.getDescriptor() == desc2;
    })).toBe(true);
    expect(goog.array.some(p.getChildren(), function(node) {
      return node.getDescriptor() == desc3;
    })).toBe(false);
  });
});
