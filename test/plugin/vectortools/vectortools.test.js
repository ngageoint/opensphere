goog.require('goog.object');
goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingManager');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.source.Vector');
goog.require('os.style.StyleType');
goog.require('plugin.vectortools');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('plugin.vectortools', function() {
  const googObject = goog.module.get('goog.object');
  const {default: ColumnMapping} = goog.module.get('os.column.ColumnMapping');
  const {default: ColumnMappingManager} = goog.module.get('os.column.ColumnMappingManager');
  const {default: ColumnDefinition} = goog.module.get('os.data.ColumnDefinition');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {default: StyleType} = goog.module.get('os.style.StyleType');
  const vectortools = goog.module.get('plugin.vectortools');

  it('should clear selected and highlighted styles on feature clone', function() {
    var feature = new Feature(new Point([0, 0]));
    feature.set(StyleType.SELECT, 42);
    feature.set(StyleType.HIGHLIGHT, 42);
    feature.set('other', 'test');

    var cloneFn = vectortools.getFeatureCloneFunction(123);
    var clone = cloneFn(feature);

    expect(clone.get('other')).toBe('test');
    expect(clone.get(StyleType.SELECT)).toBe(undefined);
    expect(clone.get(StyleType.HIGHLIGHT)).toBe(undefined);
    expect(clone.get(RecordField.SOURCE_ID)).toBe(123);
  });

  it('should get column mappings correctly', function() {
    const dataManager = DataManager.getInstance();

    // Skip the getFilterKey path and directly return the id.
    spyOn(dataManager, 'getDescriptor').andReturn(null);

    var mappingString = '<columnMapping name="My Mapping" type="decimal" description="some description">' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer1">layer1_column1</column>' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer2">layer2_column5</column>' +
        '</columnMapping>';
    var id = 'someId';
    var config = {
      'columnMapping': mappingString,
      'id': id
    };

    var mappingString2 = '<columnMapping name="My Mapping 2" type="decimal" description="some description">' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer3">layer3_column1</column>' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer4">layer4_column5</column>' +
        '</columnMapping>';
    var id2 = 'otherId';
    var config2 = {
      'columnMapping': mappingString2,
      'id': id2
    };

    var mapping = new ColumnMapping();
    mapping.restore(config);
    var mapping2 = new ColumnMapping();
    mapping2.restore(config2);

    var cmm = ColumnMappingManager.getInstance();
    cmm.add(mapping);
    cmm.add(mapping2);

    var mappings = vectortools.getColumnMappings(['https://fake.server.bits/ogc/wfsServer!!fake:layer1',
      'https://fake.server.bits/ogc/wfsServer!!fake:layer2']);

    expect(googObject.getCount(mappings)).toBe(1);
    expect(mappings['https://fake.server.bits/ogc/wfsServer!!fake:layer2']['layer2_column5']).toBe('layer1_column1');

    var mappings = vectortools.getColumnMappings(['https://fake.server.bits/ogc/wfsServer!!fake:layer1',
      'https://fake.server.bits/ogc/wfsServer!!fake:layer2', 'https://fake.server.bits/ogc/wfsServer!!fake:layer3',
      'https://fake.server.bits/ogc/wfsServer!!fake:layer4']);

    expect(googObject.getCount(mappings)).toBe(2);
    expect(mappings['https://fake.server.bits/ogc/wfsServer!!fake:layer2']['layer2_column5']).toBe('layer1_column1');
    expect(mappings['https://fake.server.bits/ogc/wfsServer!!fake:layer4']['layer4_column5']).toBe('layer3_column1');
  });

  it('should run column mappings correctly', function() {
    // simple mapping from column1 to column2
    var mapping = {
      'column1': 'column2'
    };

    var feature = new Feature();
    feature.set('column1', 'value1');
    feature.set('column2', undefined);

    vectortools.runColumnMapping(mapping, feature);

    expect(feature.get('column1')).toBe(undefined);
    expect(feature.get('column2')).toBe('value1');

    // it shouldn't overwrite a value that is already set
    var feature = new Feature();
    feature.set('column1', 'value1');
    feature.set('column2', 'value2');

    vectortools.runColumnMapping(mapping, feature);

    expect(feature.get('column1')).toBe('value1');
    expect(feature.get('column2')).toBe('value2');
  });

  it('should get combined columns based off of mappings', function() {
    // simple mapping from column1 to column2
    var mappings = {
      'https://fake.server.bits/ogc/wfsServer!!fake:layer1': {
        'column1': 'tacos',
        'column2': 'burritos'
      }
    };

    var source = new VectorSource();
    source.setId('https://fake.server.bits/ogc/wfsServer!!fake:layer1');

    // add ID column because vector sources will add it anyway
    var columns = ['ID', 'column1', 'column2', 'column3'];
    source.setColumns(columns);

    var burritoSource = new VectorSource();
    burritoSource.setId('https://fake.server.bits/ogc/wfsServer!!fake:burritoLayer');
    var burritoColumns = [
      new ColumnDefinition('tacos'),
      new ColumnDefinition('burritos')
    ];
    burritoSource.setColumns(burritoColumns);

    var combinedColumns = vectortools.getCombinedColumns([source, burritoSource], mappings);
    expect(combinedColumns.length).toBe(4);
    expect(combinedColumns[0]['field']).toBe('ID');
    expect(combinedColumns[1]['field']).toBe('column3');
    expect(combinedColumns[2]['field']).toBe('tacos');
    expect(combinedColumns[3]['field']).toBe('burritos');
  });
});
