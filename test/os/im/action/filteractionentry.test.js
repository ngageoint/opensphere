goog.require('goog.functions');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.ImportActionManager');
goog.require('os.im.action.mock');
goog.require('os.im.action.mock.MockAction');


describe('os.im.action.FilterActionEntry', function() {
  const functions = goog.module.get('goog.functions');
  const FilterActionEntry = goog.module.get('os.im.action.FilterActionEntry');
  const ImportActionManager = goog.module.get('os.im.action.ImportActionManager');
  const {getMockManager} = goog.module.get('os.im.action.mock');
  const MockAction = goog.module.get('os.im.action.mock.MockAction');

  var filterXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>PROPERTY</PropertyName>' +
      '<Literal>AAA*</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var testFilterFn = function(entry) {
    var obj = {};
    expect(entry.filterFn(obj)).toBe(false);

    obj.PROPERTY = 'AAAbbb';
    expect(entry.filterFn(obj)).toBe(true);

    obj.PROPERTY = 'bbbAAA';
    expect(entry.filterFn(obj)).toBe(false);
  };

  var testMockAction = function(entry) {
    var obj1 = {
      PROPERTY: 'AAAbbb'
    };

    var obj2 = {
      PROPERTY: 'bbbAAA'
    };

    entry.processItems([obj1, obj2]);
    expect(obj1.MATCH).toBe(true);
    expect(obj2.MATCH).toBeUndefined();
  };

  it('should initialize correctly', function() {
    var fe = new FilterActionEntry();

    expect(typeof fe.getId() === 'string').toBe(true);
    expect(fe.actions.length).toBe(0);
    expect(fe.filterFn).toBe(functions.FALSE);
    expect(fe.isTemporary()).toBe(false);
    expect(fe.getTitle()).toBe('New Filter Action');
  });

  it('should create a filter function from the XML filter', function() {
    var fe = new FilterActionEntry();
    expect(fe.filterFn).toBe(functions.FALSE);
    fe.setFilter(filterXml);

    expect(fe.filterFn).not.toBe(functions.FALSE);
    testFilterFn(fe);
  });

  it('should execute actions against objects that match a filter', function() {
    var fe = new FilterActionEntry();
    fe.setFilter(filterXml);
    fe.actions = [new MockAction()];
    testMockAction(fe);
  });

  it('should clone/persist/restore properly', function() {
    spyOn(ImportActionManager, 'getInstance').andCallFake(getMockManager);

    var fe = new FilterActionEntry();
    fe.setFilter(filterXml);
    fe.actions = [new MockAction()];

    var id = fe.getId();
    fe.setTitle('Clone Me');
    fe.setDescription('Clone Description');
    fe.type = 'LAYER#features';
    fe.setFilter(filterXml);

    var clone = fe.clone();
    expect(clone.getId()).toBe(id);
    expect(clone.getTitle()).toBe('Clone Me');
    expect(clone.getDescription()).toBe('Clone Description');
    expect(clone.type).toBe('LAYER#features');
    expect(clone.getFilter()).toBe(filterXml);
    expect(clone.getFilterNode()).not.toBe(null);
    expect(clone.actions.length).toBe(1);

    // filter function should be set correctly from the filter
    testFilterFn(clone);

    // actions should be restored
    testMockAction(clone);
  });

  it('should compare properly', function() {
    spyOn(ImportActionManager, 'getInstance').andCallFake(getMockManager);
    var filterXml2 = filterXml + filterXml;

    var fe = new FilterActionEntry();
    fe.setTitle('Compare Me');
    fe.setFilter(filterXml);
    fe.actions = [new MockAction()];

    var other = new FilterActionEntry();
    other.setTitle('Compare Me');
    other.setFilter(filterXml);
    other.actions = [new MockAction()];

    expect(fe.compare(other)).toBe(0);

    other.setFilter(filterXml2);
    expect(fe.compare(other)).toBe(-1);
    expect(other.compare(fe)).toBe(1);

    fe.actions.push(new MockAction());
    expect(fe.compare(other)).toBe(1);
    expect(other.compare(fe)).toBe(-1);

    other.setTitle('Compare Me!');
    expect(fe.compare(other)).toBe(-1);
    expect(other.compare(fe)).toBe(1);

    var clone = fe.clone();
    expect(fe.compare(clone)).toBe(0);
  });
});
