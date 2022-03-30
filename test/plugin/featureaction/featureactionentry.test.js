goog.require('goog.functions');
goog.require('os.im.action.ImportActionManager');
goog.require('plugin.im.action.feature.Entry');
goog.require('plugin.im.action.feature.mock');
goog.require('plugin.im.action.feature.mock.MockAction');

import Feature from 'ol/src/Feature.js';

describe('plugin.im.action.feature.Entry', function() {
  const functions = goog.module.get('goog.functions');
  const {default: ImportActionManager} = goog.module.get('os.im.action.ImportActionManager');
  const {default: Entry} = goog.module.get('plugin.im.action.feature.Entry');
  const {getMockManager} = goog.module.get('plugin.im.action.feature.mock');
  const MockAction = goog.module.get('plugin.im.action.feature.mock.MockAction');

  var filterXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>PROPERTY</PropertyName>' +
      '<Literal>AAA*</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var testFilterFn = function(entry) {
    var feature = new Feature();
    expect(entry.filterFn(feature)).toBe(false);

    feature.set('PROPERTY', 'AAAbbb');
    expect(entry.filterFn(feature)).toBe(true);

    feature.set('PROPERTY', 'bbbAAA');
    expect(entry.filterFn(feature)).toBe(false);
  };

  var testMockAction = function(entry) {
    var feature1 = new Feature({
      PROPERTY: 'AAAbbb'
    });

    var feature2 = new Feature({
      PROPERTY: 'bbbAAA'
    });

    entry.processItems([feature1, feature2]);
    expect(feature1.get('MATCH')).toBe(true);
    expect(feature2.get('MATCH')).toBeUndefined();
  };

  const originalManager = ImportActionManager.getInstance();

  beforeEach(() => {
    ImportActionManager.setInstance(getMockManager());
  });

  afterEach(() => {
    ImportActionManager.setInstance(originalManager);
  });

  it('should initialize correctly', function() {
    var fe = new Entry();

    expect(typeof fe.getId() === 'string').toBe(true);
    expect(fe.actions.length).toBe(0);
    expect(fe.filterFn).toBe(functions.FALSE);
    expect(fe.isTemporary()).toBe(false);
    expect(fe.getTitle()).toBe('New Feature Action');
  });

  it('should create a filter function from the XML filter', function() {
    var fe = new Entry();
    expect(fe.filterFn).toBe(functions.FALSE);
    fe.setFilter(filterXml);

    expect(fe.filterFn).not.toBe(functions.FALSE);
    testFilterFn(fe);
  });

  it('should execute actions against objects that match a filter', function() {
    var fe = new Entry();
    fe.setFilter(filterXml);
    fe.actions = [new MockAction()];
    testMockAction(fe);
  });

  it('should clone/persist/restore properly', function() {
    var fe = new Entry();
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
});
