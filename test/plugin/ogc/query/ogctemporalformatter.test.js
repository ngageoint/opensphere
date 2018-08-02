goog.require('goog.Uri');
goog.require('os.time.TimelineController');
goog.require('plugin.ogc.query.OGCTemporalFormatter');

describe('plugin.ogc.query.OGCTemporalFormatter', function() {
  it('sets start/end columns with defaults', function() {
    var formatter = new plugin.ogc.query.OGCTemporalFormatter();
    expect(formatter.startColumn_).toBe(plugin.ogc.query.OGCTemporalFormatter.DEFAULT_COLUMN_);
    expect(formatter.endColumn_).toBe(plugin.ogc.query.OGCTemporalFormatter.DEFAULT_COLUMN_);

    var testStart = 'testStartColumn';
    var testEnd = 'testEndColumn';
    formatter.setStartColumn(testStart);
    formatter.setEndColumn(testEnd);
    expect(formatter.startColumn_).toBe(testStart);
    expect(formatter.endColumn_).toBe(testEnd);

    formatter.setStartColumn('');
    formatter.setEndColumn('');
    expect(formatter.startColumn_).toBe(plugin.ogc.query.OGCTemporalFormatter.DEFAULT_COLUMN_);
    expect(formatter.endColumn_).toBe(plugin.ogc.query.OGCTemporalFormatter.DEFAULT_COLUMN_);

    formatter.setStartColumn(null);
    formatter.setEndColumn(null);
    expect(formatter.startColumn_).toBe(plugin.ogc.query.OGCTemporalFormatter.DEFAULT_COLUMN_);
    expect(formatter.endColumn_).toBe(plugin.ogc.query.OGCTemporalFormatter.DEFAULT_COLUMN_);
  });

  it('modifies a uri param', function() {
    var formatter = new plugin.ogc.query.OGCTemporalFormatter();
    var testStart = 'testStartColumn';
    var testEnd = 'testEndColumn';
    formatter.setStartColumn(testStart);
    formatter.setEndColumn(testEnd);

    var controller = new os.time.TimelineController();
    var startTime = goog.now();
    var endTime = startTime + 5000;
    controller.setRange(controller.buildRange(startTime, endTime));

    var result = formatter.format(controller);
    var expected = '<Or><And><PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyName>' + testEnd + '</PropertyName>' +
        '<Literal>' + os.time.format(new Date(startTime), undefined, false, true) + '</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
        '<PropertyName>' + testStart + '</PropertyName>' +
        '<Literal>' + os.time.format(new Date(endTime), undefined, false, true) + '</Literal>' +
        '</PropertyIsLessThan></And></Or>';
    expect(result).toBe(expected);
  });

  it('handles multiple ranges, orders from oldest to newest', function() {
    var formatter = new plugin.ogc.query.OGCTemporalFormatter();
    var testStart = 'testStartColumn';
    var testEnd = 'testEndColumn';
    formatter.setStartColumn(testStart);
    formatter.setEndColumn(testEnd);

    var controller = new os.time.TimelineController();
    var startTime = goog.now();
    var endTime = startTime + 5000;
    controller.setRange(controller.buildRange(startTime, endTime));
    controller.addLoadRange(controller.buildRange(startTime - 86400000, startTime - 86400000 + 50000));

    var result = formatter.format(controller);
    var expected = '<Or><And><PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyName>' + testEnd + '</PropertyName>' +
        '<Literal>' + os.time.format(new Date(startTime - 86400000), undefined, false, true) + '</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
        '<PropertyName>' + testStart + '</PropertyName>' +
        '<Literal>' + os.time.format(new Date(startTime - 86400000 + 50000), undefined, false, true) + '</Literal>' +
        '</PropertyIsLessThan></And>' +
        '<And><PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyName>' + testEnd + '</PropertyName>' +
        '<Literal>' + os.time.format(new Date(startTime), undefined, false, true) + '</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
        '<PropertyName>' + testStart + '</PropertyName>' +
        '<Literal>' + os.time.format(new Date(endTime), undefined, false, true) + '</Literal>' +
        '</PropertyIsLessThan></And></Or>';
    expect(result).toBe(expected);
  });
});
