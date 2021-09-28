goog.require('os.mock');
goog.require('plugin.basemap');
goog.require('plugin.basemap.BaseMapDescriptor');

describe('plugin.basemap.BaseMapDescriptor', function() {
  const basemap = goog.module.get('plugin.basemap');
  const {
    default: BaseMapDescriptor
  } = goog.module.get('plugin.basemap.BaseMapDescriptor');

  it('should have the correct defaults', function() {
    var d = new BaseMapDescriptor();
    expect(d.getDescriptorType()).toBe(basemap.ID);
    expect(d.getTags()).toContain('GEOINT');
    expect(d.getType()).toBe('Map Layers');
    expect(d.canDelete()).toBe(true);
  });
});
