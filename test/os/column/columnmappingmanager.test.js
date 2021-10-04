goog.require('goog.object');
goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingEventType');
goog.require('os.column.ColumnMappingManager');
goog.require('os.mock');


describe('os.column.ColumnMappingManager', function() {
  const googObject = goog.module.get('goog.object');
  const {default: ColumnMapping} = goog.module.get('os.column.ColumnMapping');
  const {default: ColumnMappingEventType} = goog.module.get('os.column.ColumnMappingEventType');
  const {default: ColumnMappingManager} = goog.module.get('os.column.ColumnMappingManager');

  var cmm;
  var mappingString = '<columnMapping name="My Mapping" type="decimal" description="some description">' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer1">layer1_column1</column>' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer2">layer2_column5</column>' +
      '</columnMapping>';
  var id = 'someId';
  var config = {
    'columnMapping': mappingString,
    'id': id
  };

  var mapping = new ColumnMapping();
  mapping.restore(config);

  beforeEach(function() {
    cmm = ColumnMappingManager.getInstance();
    cmm.clear();
    cmm.save();
  });

  it('should hash columns with a "#" in the middle', function() {
    var layerName = 'https://fake.server.bits/ogc/wfsServer!!fake:layer69';
    var columnName = 'layer69_column416';
    var hash = ColumnMappingManager.hashLayerColumn(layerName, columnName);
    expect(hash).toBe(layerName + '#' + columnName);
  });

  it('should add mappings and keep track of them by hash', function() {
    var column1 = mapping.getColumns()[0];
    var column2 = mapping.getColumns()[1];
    var hash1 = ColumnMappingManager.hashColumn(column1);
    var hash2 = ColumnMappingManager.hashColumn(column2);

    expect(cmm.items_.length).toBe(0);
    expect(googObject.getCount(cmm.layerColumnMap_)).toBe(0);

    cmm.add(mapping);

    expect(cmm.items_.length).toBe(1);
    expect(googObject.getCount(cmm.layerColumnMap_)).toBe(2);
    expect(cmm.layerColumnMap_[hash1]).toBe(id);
    expect(cmm.layerColumnMap_[hash2]).toBe(id);
  });

  it('should add an owned column when a managed mapping does', function() {
    cmm.add(mapping);
    expect(cmm.items_.length).toBe(1);
    expect(googObject.getCount(cmm.layerColumnMap_)).toBe(2);

    var layerName = 'https://fake.server.bits/ogc/wfsServer!!fake:layer99';
    var columnName = 'layer99_column50';
    var hash = ColumnMappingManager.hashLayerColumn(layerName, columnName);
    expect(cmm.layerColumnMap_[hash]).toBe(undefined);

    mapping.addColumn(layerName, columnName);
    expect(cmm.layerColumnMap_[hash]).toBe(id);
    expect(googObject.getCount(cmm.layerColumnMap_)).toBe(3);
  });

  it('should remove an owned column when a managed mapping does', function() {
    var column1 = mapping.getColumns()[0];
    var hash1 = ColumnMappingManager.hashColumn(column1);

    cmm.add(mapping);
    expect(cmm.items_.length).toBe(1);
    expect(googObject.getCount(cmm.layerColumnMap_)).toBe(3);
    expect(cmm.layerColumnMap_[hash1]).toBe(id);

    mapping.removeColumn(column1);
    expect(googObject.getCount(cmm.layerColumnMap_)).toBe(2);
    expect(cmm.layerColumnMap_[hash1]).toBe(undefined);
  });

  it('should fire an event after a delay on change', function() {
    var fired = false;
    var listener = function() {
      fired = true;
    };

    cmm.listenOnce(ColumnMappingEventType.MAPPINGS_CHANGE, listener);
    cmm.onChange();

    waitsFor(function() {
      return fired;
    }, 'change listener to fire');
  });

  var mappingString1 = '<columnMapping name="Mapping 1" type="string" description="meps 1">' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer6">layer6_column30</column>' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer7">layer7_column9</column>' +
      '</columnMapping>';
  var id1 = 'id1';
  var mappingString2 = '<columnMapping name="mepping 2" type="decimal" description="meeeps 2">' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer!@#$%">layer!@#$%"_column<><><></column>' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer90">layer90_column23</column>' +
      '<column layer="https://fake.server.bits/ogc/wfsServer!!fake:layer45">layer45_column37</column>' +
      '</columnMapping>';
  var id2 = 'id2';

  var config1 = {
    'columnMapping': mappingString1,
    'id': id1
  };
  var config2 = {
    'columnMapping': mappingString2,
    'id': id2
  };

  var mapping1 = new ColumnMapping();
  mapping1.restore(config1);
  var mapping2 = new ColumnMapping();
  mapping2.restore(config2);

  it('should be able to bulk add column mappings', function() {
    cmm.bulkAdd([mapping1, mapping2]);
    expect(cmm.getAll().length).toBe(2);
  });

  it('should be able to remove column mappings', function() {
    cmm.bulkAdd([mapping1, mapping2]);
    expect(cmm.getAll().length).toBe(2);

    var column1 = mapping1.getColumns()[0];
    var hash1 = ColumnMappingManager.hashColumn(column1);
    var ownerMapping = cmm.getOwnerMapping(hash1);
    expect(ownerMapping).toBe(mapping1);

    var removed = cmm.remove(mapping1);
    expect(removed).toBe(mapping1);
    expect(cmm.getAll().length).toBe(1);

    ownerMapping = cmm.getOwnerMapping(hash1);
    expect(ownerMapping).toBeFalsy();
  });
});
