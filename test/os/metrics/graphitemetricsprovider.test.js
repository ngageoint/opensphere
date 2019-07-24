goog.require('os.metrics.GraphiteMetricsProvider');

describe('os.metrics.GraphiteMetricsProvider', function() {
  it('should instantiate', function() {
    var provider = new os.metrics.GraphiteMetricsProvider();
    expect(provider).not.toBe(null);
  });

  it('should have default JSON content type', function() {
    var provider = new os.metrics.GraphiteMetricsProvider();
    expect(provider.getContentType()).toBe('application/json');
  });

  it('should record metrics', function() {
    var provider = new os.metrics.GraphiteMetricsProvider();
    provider.recordMetric('a', 1);
    expect(provider.metrics_).toEqual([{'name': 'a', 'value': 1}]);
    provider.recordMetric('b', 2);
    expect(provider.metrics_).toEqual([{'name': 'a', 'value': 1}, {'name': 'b', 'value': 2}]);
  });
});
