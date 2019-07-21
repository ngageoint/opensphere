goog.require('os.metrics.Metrics');
goog.require('os.mock');

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

  it('should have metrics disabled by default', function() {
    var metrics = new os.metrics.Metrics();
    expect(metrics.isEnabled()).toBe(false);
    var key = 'test.key2';
    metrics.updateMetric(key, 1);
    expect(metrics.getMetric(key)).toBe(0);
  });

  it('should have default metric value of 0', function() {
    var metrics = new os.metrics.Metrics();
    metrics.enabled_ = true;
    var key = 'xyzzy';
    expect(metrics).not.toBe(null);
    expect(metrics.hasMetric(key)).toBe(false);
    expect(metrics.getMetric(key)).toBe(0);
  });
});
