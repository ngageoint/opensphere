goog.require('goog.math.Range');
goog.require('os.MapContainer');
goog.require('os.data.BaseDescriptor');
goog.require('os.data.DataManager');
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
goog.require('os.time.TimelineController');
goog.require('os.ui.ogc.OGCDescriptor');
goog.require('plugin.ogc.OGCLayerDescriptor');

import Feature from 'ol/src/Feature.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';

describe('os.source', function() {
  const Range = goog.module.get('goog.math.Range');
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: BaseDescriptor} = goog.module.get('os.data.BaseDescriptor');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const fn = goog.module.get('os.fn');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osSource = goog.module.get('os.source');
  const MockSource = goog.module.get('os.source.MockSource');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {default: StyleType} = goog.module.get('os.style.StyleType');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');
  const {default: TimelineController} = goog.module.get('os.time.TimelineController');
  const {default: OGCDescriptor} = goog.module.get('os.ui.ogc.OGCDescriptor');
  const {default: OGCLayerDescriptor} = goog.module.get('plugin.ogc.OGCLayerDescriptor');

  it('checks if a source is filterable', function() {
    var descriptor = null;
    var layer = null;
    var source = null;

    var dataManager = DataManager.getInstance();
    var map = MapContainer.getInstance();

    spyOn(dataManager, 'getDescriptor').andCallFake(function() {
      return descriptor;
    });

    spyOn(map, 'getLayer').andCallFake(function() {
      return layer;
    });

    expect(osSource.isFilterable(source)).toBe(false,
        'should not be filterable with a null source');

    source = new VectorSource();
    expect(osSource.isFilterable(source)).toBe(false,
        'should not be filterable with a null descriptor/layer');

    layer = new OLVectorLayer();
    expect(osSource.isFilterable(source)).toBe(false,
        'should not be filterable if the layer does not implement os.layer.ILayer');

    layer = new VectorLayer();
    layer.setFilterLauncher(null);
    expect(osSource.isFilterable(source)).toBe(false,
        'should not be filterable if the layer is not filterable');

    layer.setFilterLauncher(fn.noop);
    expect(osSource.isFilterable(source)).toBe(true,
        'should be filterable if the layer is filterable');

    descriptor = new BaseDescriptor();
    expect(osSource.isFilterable(source)).toBe(true,
        'should be filterable if the layer is filterable, but descriptor is not');

    layer = null;
    expect(osSource.isFilterable(source)).toBe(false,
        'should not be filterable if the descriptor is not filterable');

    descriptor = new OGCDescriptor();
    expect(osSource.isFilterable(source)).toBe(true,
        'should be filterable if the descriptor is filterable');

    descriptor = new OGCLayerDescriptor();
    descriptor.setWfsEnabled(true);
    expect(osSource.isFilterable(source)).toBe(true,
        'should be filterable with ogc descriptors');
  });

  it('gets the record time from a feature', function() {
    expect(osSource.getRecordTime(undefined)).toBeNull('undefined input should not return a time');
    expect(osSource.getRecordTime(null)).toBeNull('null input should not return a time');
    expect(osSource.getRecordTime({})).toBeNull('object input should not return a time');

    var now = Date.now();
    var feature = new Feature();
    expect(osSource.getRecordTime(feature)).toBeNull('undefined field should not return a time');

    feature.set(RecordField.TIME, true);
    expect(osSource.getRecordTime(feature)).toBeNull('boolean should not return a time');

    feature.set(RecordField.TIME, 'test');
    expect(osSource.getRecordTime(feature)).toBeNull('string should not return a time');

    feature.set(RecordField.TIME, now);
    expect(osSource.getRecordTime(feature)).toBeNull('number should not return a time');

    feature.set(RecordField.TIME, new Date(now));
    expect(osSource.getRecordTime(feature)).toBeNull('Date should not return a time');

    var timeInstant = new TimeInstant(now);
    feature.set(RecordField.TIME, timeInstant);
    expect(osSource.getRecordTime(feature)).toBe(timeInstant, 'time instant should be returned');

    var timeRange = new TimeRange(now, now + 20);
    feature.set(RecordField.TIME, timeRange);
    expect(osSource.getRecordTime(feature)).toBe(timeRange, 'time range should be returned');

    var holdRange = new Range(now - 20, now + 40);
    var tlc = TimelineController.getInstance();
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    expect(osSource.getRecordTime(feature)).toBeNull('held time range should not be returned');

    feature.set(RecordField.TIME, timeInstant);
    expect(osSource.getRecordTime(feature)).toBeNull('held time instant should not be returned');

    tlc.clearHoldRanges();
  });

  it('gets the held record time from a feature', function() {
    expect(osSource.getHoldRecordTime(undefined)).toBeNull('undefined input should not return a time');
    expect(osSource.getHoldRecordTime(null)).toBeNull('null input should not return a time');
    expect(osSource.getHoldRecordTime({})).toBeNull('object input should not return a time');

    var now = Date.now();
    var feature = new Feature();
    expect(osSource.getHoldRecordTime(feature)).toBeNull('undefined field should not return a time');

    feature.set(RecordField.TIME, true);
    expect(osSource.getHoldRecordTime(feature)).toBeNull('boolean should not return a time');

    feature.set(RecordField.TIME, 'test');
    expect(osSource.getHoldRecordTime(feature)).toBeNull('string should not return a time');

    feature.set(RecordField.TIME, now);
    expect(osSource.getHoldRecordTime(feature)).toBeNull('number should not return a time');

    feature.set(RecordField.TIME, new Date(now));
    expect(osSource.getHoldRecordTime(feature)).toBeNull('Date should not return a time');

    var timeInstant = new TimeInstant(now);
    feature.set(RecordField.TIME, timeInstant);
    expect(osSource.getHoldRecordTime(feature)).toBeNull('time instant should not be returned');

    var timeRange = new TimeRange(now, now + 20);
    feature.set(RecordField.TIME, timeRange);
    expect(osSource.getHoldRecordTime(feature)).toBeNull('time range should not be returned');

    var holdRange = new Range(now - 20, now + 40);
    var tlc = TimelineController.getInstance();
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    expect(osSource.getHoldRecordTime(feature)).toBe(timeRange, 'held time range should be returned');

    feature.set(RecordField.TIME, timeInstant);
    expect(osSource.getHoldRecordTime(feature)).toBe(timeInstant, 'held time instant should be returned');

    tlc.clearHoldRanges();
  });

  it('gets columns that should be exported by a source', function() {
    expect(osSource.getExportFields(null)).toBeNull();

    var columns = [];
    var source = new MockSource();
    source.setColumns(columns);

    var fields = osSource.getExportFields(source);
    expect(fields).toBeNull();

    // hidden fields are not exported
    columns.push({
      field: 'notVisible',
      visible: false
    });

    fields = osSource.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(0);

    // empty fields are not exported
    columns.push({
      field: '   ',
      visible: true
    });

    fields = osSource.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(0);

    // internal fields are not exported
    columns.push({
      field: RecordField.TIME,
      visible: true
    }, {
      field: StyleType.FEATURE,
      visible: true
    });

    fields = osSource.getExportFields(source);
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

    fields = osSource.getExportFields(source);
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

    fields = osSource.getExportFields(source);
    expect(fields).toBeDefined();
    expect(fields.length).toBe(2);
    expect(fields).toContain('TEST 1');
    expect(fields).toContain('TEST 2');
  });
});
