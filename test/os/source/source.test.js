goog.require('ol.Feature');
goog.require('ol.layer.Vector');
goog.require('os.data.BaseDescriptor');
goog.require('os.data.RecordField');
goog.require('os.fn');
goog.require('os.layer.Vector');
goog.require('os.mock');
goog.require('os.source');
goog.require('os.source.MockSource');
goog.require('os.source.Vector');
goog.require('os.style.StyleType');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.ogc.OGCDescriptor');

describe('os.source', function() {
  it('checks if a source is filterable', function() {
    var descriptor = null;
    var layer = null;
    var source = null;

    var dataManager = os.dataManager;
    var map = os.MapContainer.getInstance();

    spyOn(dataManager, 'getDescriptor').andCallFake(function() {
      return descriptor;
    });

    spyOn(map, 'getLayer').andCallFake(function() {
      return layer;
    });

    expect(os.source.isFilterable(source)).toBe(false,
        'should not be filterable with a null source');

    source = new os.source.Vector();
    expect(os.source.isFilterable(source)).toBe(false,
        'should not be filterable with a null descriptor/layer');

    layer = new ol.layer.Vector();
    expect(os.source.isFilterable(source)).toBe(false,
        'should not be filterable if the layer does not implement os.layer.ILayer');

    layer = new os.layer.Vector();
    layer.setFilterLauncher(null);
    expect(os.source.isFilterable(source)).toBe(false,
        'should not be filterable if the layer is not filterable');

    layer.setFilterLauncher(os.fn.noop);
    expect(os.source.isFilterable(source)).toBe(true,
        'should be filterable if the layer is filterable');

    descriptor = new os.data.BaseDescriptor();
    expect(os.source.isFilterable(source)).toBe(true,
        'should be filterable if the layer is filterable, but descriptor is not');

    layer = null;
    expect(os.source.isFilterable(source)).toBe(false,
        'should not be filterable if the descriptor is not filterable');

    descriptor = new os.ui.ogc.OGCDescriptor();
    expect(os.source.isFilterable(source)).toBe(true,
        'should be filterable if the descriptor is filterable');

    descriptor = new plugin.ogc.OGCLayerDescriptor();
    descriptor.setWfsEnabled(true);
    expect(os.source.isFilterable(source)).toBe(true,
        'should be filterable with ogc descriptors');
  });

  it('gets the record time from a feature', function() {
    expect(os.source.getRecordTime(undefined)).toBeNull('undefined input should not return a time');
    expect(os.source.getRecordTime(null)).toBeNull('null input should not return a time');
    expect(os.source.getRecordTime({})).toBeNull('object input should not return a time');

    var now = Date.now();
    var feature = new ol.Feature();
    expect(os.source.getRecordTime(feature)).toBeNull('undefined field should not return a time');

    feature.set(os.data.RecordField.TIME, true);
    expect(os.source.getRecordTime(feature)).toBeNull('boolean should not return a time');

    feature.set(os.data.RecordField.TIME, 'test');
    expect(os.source.getRecordTime(feature)).toBeNull('string should not return a time');

    feature.set(os.data.RecordField.TIME, now);
    expect(os.source.getRecordTime(feature)).toBeNull('number should not return a time');

    feature.set(os.data.RecordField.TIME, new Date(now));
    expect(os.source.getRecordTime(feature)).toBeNull('Date should not return a time');

    var timeInstant = new os.time.TimeInstant(now);
    feature.set(os.data.RecordField.TIME, timeInstant);
    expect(os.source.getRecordTime(feature)).toBe(timeInstant, 'time instant should be returned');

    var timeRange = new os.time.TimeRange(now, now + 20);
    feature.set(os.data.RecordField.TIME, timeRange);
    expect(os.source.getRecordTime(feature)).toBe(timeRange, 'time range should be returned');

    var holdRange = new goog.math.Range(now - 20, now + 40);
    var tlc = os.time.TimelineController.getInstance();
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    expect(os.source.getRecordTime(feature)).toBeNull('held time range should not be returned');

    feature.set(os.data.RecordField.TIME, timeInstant);
    expect(os.source.getRecordTime(feature)).toBeNull('held time instant should not be returned');

    tlc.clearHoldRanges();
  });

  it('gets the held record time from a feature', function() {
    expect(os.source.getHoldRecordTime(undefined)).toBeNull('undefined input should not return a time');
    expect(os.source.getHoldRecordTime(null)).toBeNull('null input should not return a time');
    expect(os.source.getHoldRecordTime({})).toBeNull('object input should not return a time');

    var now = Date.now();
    var feature = new ol.Feature();
    expect(os.source.getHoldRecordTime(feature)).toBeNull('undefined field should not return a time');

    feature.set(os.data.RecordField.TIME, true);
    expect(os.source.getHoldRecordTime(feature)).toBeNull('boolean should not return a time');

    feature.set(os.data.RecordField.TIME, 'test');
    expect(os.source.getHoldRecordTime(feature)).toBeNull('string should not return a time');

    feature.set(os.data.RecordField.TIME, now);
    expect(os.source.getHoldRecordTime(feature)).toBeNull('number should not return a time');

    feature.set(os.data.RecordField.TIME, new Date(now));
    expect(os.source.getHoldRecordTime(feature)).toBeNull('Date should not return a time');

    var timeInstant = new os.time.TimeInstant(now);
    feature.set(os.data.RecordField.TIME, timeInstant);
    expect(os.source.getHoldRecordTime(feature)).toBeNull('time instant should not be returned');

    var timeRange = new os.time.TimeRange(now, now + 20);
    feature.set(os.data.RecordField.TIME, timeRange);
    expect(os.source.getHoldRecordTime(feature)).toBeNull('time range should not be returned');

    var holdRange = new goog.math.Range(now - 20, now + 40);
    var tlc = os.time.TimelineController.getInstance();
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    expect(os.source.getHoldRecordTime(feature)).toBe(timeRange, 'held time range should be returned');

    feature.set(os.data.RecordField.TIME, timeInstant);
    expect(os.source.getHoldRecordTime(feature)).toBe(timeInstant, 'held time instant should be returned');

    tlc.clearHoldRanges();
  });

  it('gets columns that should be exported by a source', function() {
    expect(os.source.getExportFields(null)).toBeNull();

    var columns = [];
    var source = new os.source.MockSource();
    source.setColumns(columns);

    var fields = os.source.getExportFields(source);
    expect(fields).toBeNull();

    // hidden fields are not exported
    columns.push({
      field: 'notVisible',
      visible: false
    });

    fields = os.source.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(0);

    // empty fields are not exported
    columns.push({
      field: '   ',
      visible: true
    });

    fields = os.source.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(0);

    // internal fields are not exported
    columns.push({
      field: os.data.RecordField.TIME,
      visible: true
    }, {
      field: os.style.StyleType.FEATURE,
      visible: true
    });

    fields = os.source.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(0);

    // other fields are exported
    columns.push({
      field: 'TEST 1',
      visible: true
    }, {
      field: 'TEST 2',
      visible: true
    });

    fields = os.source.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(2);
    expect(fields).toContain('TEST 1');
    expect(fields).toContain('TEST 2');

    // but are not duplicated
    columns.push({
      field: 'TEST 1',
      visible: true
    }, {
      field: 'TEST 2',
      visible: true
    });

    fields = os.source.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(2);
    expect(fields).toContain('TEST 1');
    expect(fields).toContain('TEST 2');
  });
});
