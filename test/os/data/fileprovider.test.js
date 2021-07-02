goog.require('goog.array');
goog.require('os.data.BaseDescriptor');
goog.require('os.data.DataManager');
goog.require('os.data.FileDescriptor');
goog.require('os.data.FileProvider');
goog.require('os.mock');

describe('os.data.FileProvider', function() {
  const googArray = goog.module.get('goog.array');
  const BaseDescriptor = goog.module.get('os.data.BaseDescriptor');
  const DataManager = goog.module.get('os.data.DataManager');
  const FileDescriptor = goog.module.get('os.data.FileDescriptor');
  const FileProvider = goog.module.get('os.data.FileProvider');

  it('should load file descriptors from the data manager', function() {
    var desc1 = new FileDescriptor();
    desc1.setId('file#one');
    var desc2 = new FileDescriptor();
    desc2.setId('file#two');
    var desc3 = new BaseDescriptor();
    desc3.setId('base#one');

    var p = new FileProvider();
    p.configure({});

    // it should've added three descriptors to the data manager
    var dm = DataManager.getInstance();
    dm.addDescriptor(desc1);
    dm.addDescriptor(desc2);
    dm.addDescriptor(desc3);

    expect(dm.getDescriptor('file#one')).toBeTruthy();
    expect(dm.getDescriptor('file#two')).toBeTruthy();
    expect(dm.getDescriptor('base#one')).toBeTruthy();

    p.load(false);
    expect(p.getChildren().length).toBe(2);
    expect(googArray.some(p.getChildren(), function(node) {
      return node.getDescriptor() == desc1;
    })).toBe(true);
    expect(googArray.some(p.getChildren(), function(node) {
      return node.getDescriptor() == desc2;
    })).toBe(true);
    expect(googArray.some(p.getChildren(), function(node) {
      return node.getDescriptor() == desc3;
    })).toBe(false);
  });
});
