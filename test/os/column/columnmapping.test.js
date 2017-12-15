goog.require('os.column.ColumnMapping');


describe('os.column.ColumnMapping', function() {
  var mappingString = '<columnMapping name="My Mapping" type="decimal" description="some description">' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer1">layer1_column1</column>' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer2">layer2_column5</column>' +
      '</columnMapping>';
  var id = 'someId';
  var config = {
    'columnMapping': mappingString,
    'id': id
  };

  it('should initialize correctly', function() {
    var mapping = new os.column.ColumnMapping();
    expect(mapping.getId()).not.toBe(null);
    expect(mapping.getName()).toBe(null);
    expect(mapping.getDescription()).toBe(null);
    expect(mapping.getValueType()).toBe(null);
    expect(mapping.getColumns()).not.toBe(null);
  });

  it('should read a mapping XML string', function() {
    var mapping = new os.column.ColumnMapping();
    var xml = '<columnMapping name="Another Mapping" type="string" description="Another description">' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer8">layer8_column7</column>' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer4">layer4_column6</column>' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer6">layer6_column5</column>' +
        '</columnMapping>';

    mapping.loadMapping(xml);
    expect(mapping.getId()).not.toBe(null);
    expect(mapping.getName()).toBe('Another Mapping');
    expect(mapping.getDescription()).toBe('Another description');
    expect(mapping.getValueType()).toBe('string');

    var columns = mapping.getColumns();
    expect(columns.length).toBe(3);
    expect(columns[0]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer8');
    expect(columns[0]['column']).toBe('layer8_column7');
    expect(columns[1]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer4');
    expect(columns[1]['column']).toBe('layer4_column6');
    expect(columns[2]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer6');
    expect(columns[2]['column']).toBe('layer6_column5');
  });

  it('should write a mapping XML string', function() {
    var mapping = new os.column.ColumnMapping();
    var name = 'Yet Another Mapping??';
    var description = 'deeeescription';
    var valueType = 'decimal';
    var layer1 = 'https://fake.server.bits/ogc/wfsServer!!fake:layer99';
    var column1 = 'cooooolumn1';
    var layer2 = 'https://fake.server.bits/ogc/wfsServer!!fake:layer66';
    var column2 = 'ALLCAPSCOLUMN';

    mapping.setName(name);
    mapping.setDescription(description);
    mapping.setValueType(valueType);
    mapping.addColumn(layer1, column1);
    mapping.addColumn(layer2, column2);

    var xml = mapping.writeMapping();
    var testXml = '<columnMapping name="Yet Another Mapping??" type="decimal" description="deeeescription">' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer99">cooooolumn1</column>' +
        '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer66">ALLCAPSCOLUMN</column>' +
        '</columnMapping>';
    expect(xml).toBe(testXml);
  });

  it('should persist/restore to/from raw XML', function() {
    var mapping = new os.column.ColumnMapping();

    // restore from the raw string mapping
    mapping.restore(config);
    expect(mapping.getId()).toBe(id);
    expect(mapping.getName()).toBe('My Mapping');
    expect(mapping.getDescription()).toBe('some description');
    expect(mapping.getValueType()).toBe('decimal');

    var columns = mapping.getColumns();
    expect(columns.length).toBe(2);
    expect(columns[0]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer1');
    expect(columns[0]['column']).toBe('layer1_column1');
    expect(columns[1]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer2');
    expect(columns[1]['column']).toBe('layer2_column5');

    // persist it and check against the raw string
    var persisted = mapping.persist();
    expect(persisted['columnMapping']).toBe(mappingString);
    expect(persisted['id']).toBe(id);
  });

  it('should add columns', function() {
    var mapping = new os.column.ColumnMapping();
    var layer = 'https://fake.server.bits/ogc/wfsServer!!fake:someLayer';
    var column = 'myLittleColumn';

    expect(mapping.getColumns().length).toBe(0);

    mapping.addColumn(layer, column);
    expect(mapping.getColumns().length).toBe(1);
    expect(mapping.getColumns()[0]['layer']).toBe(layer);
    expect(mapping.getColumns()[0]['column']).toBe(column);
  });

  it('should remove columns', function() {
    var mapping = new os.column.ColumnMapping();
    var layer = 'https://fake.server.bits/ogc/wfsServer!!fake:someLayer';
    var column = 'myLittleColumn';

    expect(mapping.getColumns().length).toBe(0);

    mapping.addColumn(layer, column);
    expect(mapping.getColumns().length).toBe(1);

    mapping.removeColumn(mapping.getColumns()[0]);
    expect(mapping.getColumns().length).toBe(0);
  });

  it('should clone correctly', function() {
    var mapping = new os.column.ColumnMapping();
    mapping.restore(config);

    var clone = mapping.clone();
    expect(clone.getId()).toBe(id);
    expect(clone.getName()).toBe('My Mapping');
    expect(clone.getDescription()).toBe('some description');
    expect(clone.getValueType()).toBe('decimal');

    var columns = clone.getColumns();
    expect(columns.length).toBe(2);
    expect(columns[0]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer1');
    expect(columns[0]['column']).toBe('layer1_column1');
    expect(columns[1]['layer']).toBe('https://fake.server.bits/ogc/wfsServer!!fake:layer2');
    expect(columns[1]['column']).toBe('layer2_column5');
  });
});
