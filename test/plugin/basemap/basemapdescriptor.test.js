goog.require('os');
goog.require('goog.events.EventTarget');
goog.require('os.events.LayerConfigEventType');
goog.require('os.events.LayerEventType');
goog.require('os.mock');
goog.require('plugin.basemap');
goog.require('plugin.basemap.BaseMapDescriptor');
goog.require('plugin.basemap.BaseMapPlugin');


describe('plugin.basemap.BaseMapDescriptor', function() {
  it('should have the correct defaults', function() {
    var d = new plugin.basemap.BaseMapDescriptor();
    expect(d.getDescriptorType()).toBe(plugin.basemap.ID);
    expect(d.getTags()).toContain('GEOINT');
    expect(d.getType()).toBe('Map Layers');
    expect(d.canDelete()).toBe(true);
  });
});
