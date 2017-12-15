goog.require('os.config.Settings');
goog.require('os.data.BaseDescriptor');
goog.require('os.data.DataManager');
goog.require('os.mock');


describe('os.data.DataManager', function() {
  var dm = new os.data.DataManager();

  it('should add descriptors', function() {
    os.settings.init('nooverrides', 'nolocalstorage');

    for (var i = 0; i < 3; i++) {
      var d = new os.data.BaseDescriptor();
      d.setId('' + i);
      d.setTitle('D' + i);
      d.setProvider('Test');
      dm.addDescriptor(d);
    }

    expect(dm.getDescriptors().length).toBe(3);
  });

  it('should only persist recently active descriptors', function() {
    dm.getDescriptor('1').setActive(true);
    dm.persistDescriptors();

    var arr = os.settings.get(dm.getDescriptorKey());
    expect(arr.length).toBe(1);
  });

  it('should restore descriptors', function() {
    // pretend we restarted by just creating a new one
    dm = new os.data.DataManager();
    dm.registerDescriptorType('base', os.data.BaseDescriptor);
    dm.restoreDescriptors();

    expect(dm.getDescriptors().length).toBe(1);
    var d = dm.getDescriptor('1');
    expect(d.getId()).toBe('1');
    expect(d.getTitle()).toBe('D1');
    expect(d.getProvider()).toBe('Test');
  });
});
