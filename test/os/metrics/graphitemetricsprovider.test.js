goog.require('os.metrics.GraphiteMetricsProvider');

describe('os.metrics.GraphiteMetricsProvider', function() {
  const {default: GraphiteMetricsProvider} = goog.module.get('os.metrics.GraphiteMetricsProvider');

  it('should instantiate', function() {
    var provider = new GraphiteMetricsProvider();
    expect(provider).not.toBe(null);
  });

  it('should have default JSON content type', function() {
    var provider = new GraphiteMetricsProvider();
    expect(provider.getContentType()).toBe('application/json');
  });

  it('should record metrics', function() {
    var provider = new GraphiteMetricsProvider();
    provider.recordMetric('a', 1);
    expect(provider.metrics_).toEqual([{'name': 'a', 'value': 1}]);
    provider.recordMetric('b', 2);
    expect(provider.metrics_).toEqual([{'name': 'a', 'value': 1}, {'name': 'b', 'value': 2}]);
  });
});
