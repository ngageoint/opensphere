goog.require('ol.Feature');
goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingManager');
goog.require('os.data.ColumnDefinition');
goog.require('os.source.Vector');
goog.require('os.style.StyleType');
goog.require('plugin.vectortools');


describe('plugin.vectortools', function() {
  it('should clear selected and highlighted styles on feature clone', function() {
    var feature = new ol.Feature(new ol.geom.Point([0, 0]));
    feature.set(os.style.StyleType.SELECT, 42);
    feature.set(os.style.StyleType.HIGHLIGHT, 42);
    feature.set('other', 'test');

    var cloneFn = plugin.vectortools.getFeatureCloneFunction(123);
    var clone = cloneFn(feature);

    expect(clone.get('other')).toBe('test');
    expect(clone.get(os.style.StyleType.SELECT)).toBe(undefined);
    expect(clone.get(os.style.StyleType.HIGHLIGHT)).toBe(undefined);
    expect(clone.get(os.data.RecordField.SOURCE_ID)).toBe(123);
  });

  it('should get column mappings correctly', function() {
    spyOn(plugin.vectortools, 'mapIdToFilterKey_').andCallFake(function(id) {
      return id;
    });

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

    var mapping = new os.column.ColumnMapping();
    mapping.restore(config);
    var mapping2 = new os.column.ColumnMapping();
    mapping2.restore(config2);

    var cmm = os.column.ColumnMappingManager.getInstance();
    cmm.add(mapping);
    cmm.add(mapping2);

    var mappings = plugin.vectortools.getColumnMappings(['https://fake.server.bits/ogc/wfsServer!!fake:layer1',
      'https://fake.server.bits/ogc/wfsServer!!fake:layer2']);

    expect(goog.object.getCount(mappings)).toBe(1);
    expect(mappings['https://fake.server.bits/ogc/wfsServer!!fake:layer2']['layer2_column5']).toBe('layer1_column1');

    var mappings = plugin.vectortools.getColumnMappings(['https://fake.server.bits/ogc/wfsServer!!fake:layer1',
      'https://fake.server.bits/ogc/wfsServer!!fake:layer2', 'https://fake.server.bits/ogc/wfsServer!!fake:layer3',
      'https://fake.server.bits/ogc/wfsServer!!fake:layer4']);

    expect(goog.object.getCount(mappings)).toBe(2);
    expect(mappings['https://fake.server.bits/ogc/wfsServer!!fake:layer2']['layer2_column5']).toBe('layer1_column1');
    expect(mappings['https://fake.server.bits/ogc/wfsServer!!fake:layer4']['layer4_column5']).toBe('layer3_column1');
  });

  it('should run column mappings correctly', function() {
    // simple mapping from column1 to column2
    var mapping = {
      'column1': 'column2'
    };

    var feature = new ol.Feature();
    feature.set('column1', 'value1');
    feature.set('column2', undefined);

    plugin.vectortools.runColumnMapping(mapping, feature);

    expect(feature.get('column1')).toBe(undefined);
    expect(feature.get('column2')).toBe('value1');

    // it shouldn't overwrite a value that is already set
    var feature = new ol.Feature();
    feature.set('column1', 'value1');
    feature.set('column2', 'value2');

    plugin.vectortools.runColumnMapping(mapping, feature);

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

    var source = new os.source.Vector();
    source.setId('https://fake.server.bits/ogc/wfsServer!!fake:layer1');

    // add ID column because vector sources will add it anyway
    var columns = ['ID', 'column1', 'column2', 'column3'];
    source.setColumns(columns);

    var burritoSource = new os.source.Vector();
    burritoSource.setId('https://fake.server.bits/ogc/wfsServer!!fake:burritoLayer');
    var burritoColumns = [
      new os.data.ColumnDefinition('tacos'),
      new os.data.ColumnDefinition('burritos')
    ];
    burritoSource.setColumns(burritoColumns);

    var combinedColumns = plugin.vectortools.getCombinedColumns([source, burritoSource], mappings);
    expect(combinedColumns.length).toBe(4);
    expect(combinedColumns[0]['field']).toBe('ID');
    expect(combinedColumns[1]['field']).toBe('column3');
    expect(combinedColumns[2]['field']).toBe('tacos');
    expect(combinedColumns[3]['field']).toBe('burritos');
  });
});
