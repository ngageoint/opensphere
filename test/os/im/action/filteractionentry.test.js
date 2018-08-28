goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.MockAction');


describe('os.im.action.FilterActionEntry', function() {
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

    entry.processItems('entryType', [obj1, obj2]);
    expect(obj1.MATCH).toBe(true);
    expect(obj2.MATCH).toBeUndefined();
  };

  it('should initialize correctly', function() {
    var fe = new os.im.action.FilterActionEntry();

    expect(goog.isString(fe.getId())).toBe(true);
    expect(fe.actions.length).toBe(0);
    expect(fe.filterFn).toBe(goog.functions.FALSE);
    expect(fe.isTemporary()).toBe(false);
    expect(fe.getTitle()).toBe('New Filter Action');
  });

  it('should create a filter function from the XML filter', function() {
    var fe = new os.im.action.FilterActionEntry();
    expect(fe.filterFn).toBe(goog.functions.FALSE);
    fe.setFilter(filterXml);

    expect(fe.filterFn).not.toBe(goog.functions.FALSE);
    testFilterFn(fe);
  });

  it('should execute actions against objects that match a filter', function() {
    var fe = new os.im.action.FilterActionEntry();
    fe.setFilter(filterXml);
    fe.actions = [new os.im.action.MockAction()];
    testMockAction(fe);
  });

  it('should clone/persist/restore properly', function() {
    spyOn(os.im.action.ImportActionManager, 'getInstance').andCallFake(os.im.action.getMockManager);

    var fe = new os.im.action.FilterActionEntry();
    fe.setFilter(filterXml);
    fe.actions = [new os.im.action.MockAction()];

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
    spyOn(os.im.action.ImportActionManager, 'getInstance').andCallFake(os.im.action.getMockManager);
    var filterXml2 = filterXml + filterXml;

    var fe = new os.im.action.FilterActionEntry();
    fe.setTitle('Compare Me');
    fe.setFilter(filterXml);
    fe.actions = [new os.im.action.MockAction()];

    var other = new os.im.action.FilterActionEntry();
    other.setTitle('Compare Me');
    other.setFilter(filterXml);
    other.actions = [new os.im.action.MockAction()];

    expect(fe.compare(other)).toBe(0);

    other.setFilter(filterXml2);
    expect(fe.compare(other)).toBe(-1);
    expect(other.compare(fe)).toBe(1);

    fe.actions.push(new os.im.action.MockAction());
    expect(fe.compare(other)).toBe(1);
    expect(other.compare(fe)).toBe(-1);

    other.setTitle('Compare Me!');
    expect(fe.compare(other)).toBe(-1);
    expect(other.compare(fe)).toBe(1);

    var clone = fe.clone();
    expect(fe.compare(clone)).toBe(0);
  });
});
