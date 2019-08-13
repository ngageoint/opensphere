goog.require('os.metrics.Metrics');

describe('os.metrics.MapMetrics', function() {
  it('should have map metrics', function() {
    var target = new os.metrics.MapMetrics();
    expect(target).not.toBe(null);
    expect(target.getLabel()).toBe('Map');
    expect(target.getDescription()).not.toBe(null);
    expect(target.getTags()).not.toBe(null);
    expect(target.getIcon()).not.toBe(null);
  });
});
