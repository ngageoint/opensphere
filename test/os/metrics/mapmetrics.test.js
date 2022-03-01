goog.require('os.metrics.MapMetrics');
goog.require('os.metrics.Metrics');

describe('os.metrics.MapMetrics', function() {
  const {default: MapMetrics} = goog.module.get('os.metrics.MapMetrics');

  it('should have map metrics', function() {
    var target = new MapMetrics();
    expect(target).not.toBe(null);
    expect(target.getLabel()).toBe('Map');
    expect(target.getDescription()).not.toBe(null);
    expect(target.getTags()).not.toBe(null);
    expect(target.getIcon()).not.toBe(null);
  });
});
