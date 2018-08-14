goog.require('ol.Feature');
goog.require('plugin.im.action.feature.Entry');
goog.require('plugin.im.action.feature.MockAction');


describe('plugin.im.action.feature.Entry', function() {
  var filterXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>PROPERTY</PropertyName>' +
      '<Literal>AAA*</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var testFilterFn = function(entry) {
    var feature = new ol.Feature();
    expect(entry.filterFn(feature)).toBe(false);

    feature.set('PROPERTY', 'AAAbbb');
    expect(entry.filterFn(feature)).toBe(true);

    feature.set('PROPERTY', 'bbbAAA');
    expect(entry.filterFn(feature)).toBe(false);
  };

  var testMockAction = function(entry) {
    var feature1 = new ol.Feature({
      PROPERTY: 'AAAbbb'
    });

    var feature2 = new ol.Feature({
      PROPERTY: 'bbbAAA'
    });

    entry.processItems([feature1, feature2]);
    expect(feature1.get('MATCH')).toBe(true);
    expect(feature2.get('MATCH')).toBeUndefined();
  };

  it('should initialize correctly', function() {
    var fe = new plugin.im.action.feature.Entry();

    expect(goog.isString(fe.getId())).toBe(true);
    expect(fe.actions.length).toBe(0);
    expect(fe.filterFn).toBe(goog.functions.FALSE);
    expect(fe.isTemporary()).toBe(false);
    expect(fe.getTitle()).toBe('New Feature Action');
  });

  it('should create a filter function from the XML filter', function() {
    var fe = new plugin.im.action.feature.Entry();
    expect(fe.filterFn).toBe(goog.functions.FALSE);
    fe.setFilter(filterXml);

    expect(fe.filterFn).not.toBe(goog.functions.FALSE);
    testFilterFn(fe);
  });

  it('should execute actions against objects that match a filter', function() {
    var fe = new plugin.im.action.feature.Entry();
    fe.setFilter(filterXml);
    fe.actions = [new plugin.im.action.feature.MockAction()];
    testMockAction(fe);
  });

  it('should clone/persist/restore properly', function() {
    spyOn(os.im.action.ImportActionManager, 'getInstance').andCallFake(plugin.im.action.feature.getMockManager);

    var fe = new plugin.im.action.feature.Entry();
    fe.setFilter(filterXml);
    fe.actions = [new plugin.im.action.feature.MockAction()];

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
});
