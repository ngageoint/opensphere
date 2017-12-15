goog.require('os.metrics.Metrics');

describe('os.metrics.Metrics', function() {
  it('should update a metric', function() {
    var target = new os.metrics.Metrics();
    target.enabled_ = true;
    var key = 'test.key';
    expect(target).not.toBe(null);
    target.updateMetric(key, 1);
    expect(target.hasMetric(key)).toBe(true);
    expect(target.getMetric(key)).toBe(1);
    target.updateMetric(key, 1);
    expect(target.getMetric(key)).toBe(2);
  });
});
