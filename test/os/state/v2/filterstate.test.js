goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.state.v2.Filter');
goog.require('os.state.v2.FilterTag');
goog.require('os.xml');


describe('os.state.v2.Filter', function() {
  var filters = '<filters xmlns:ogc="http://www.opengis.net/ogc">' +
      '<filter id="filter1" active="true" filterType="single" title="Title 1" type="layer1" match="OR">' +
      '<ogc:And namehint="Alttiude 9999">' +
      '<ogc:PropertyIsLike wildCard="*" singleChar="." escape="\">' +
      '<ogc:PropertyName>Altitude</ogc:PropertyName>' +
      '<ogc:Literal>' +
      '<![CDATA[ 9999 ]]>' +
      '</ogc:Literal>' +
      '</ogc:PropertyIsLike>' +
      '</ogc:And>' +
      '</filter>' +
      '<filter id="filter2" active="true" filterType="single" title="Title 2" type="layer1" match="AND">' +
      '<ogc:And namehint="Speed 50">' +
      '<ogc:PropertyIsLike wildCard="*" singleChar="." escape="\">' +
      '<ogc:PropertyName>Speed</ogc:PropertyName>' +
      '<ogc:Literal>' +
      '<![CDATA[ 50 ]]>' +
      '</ogc:Literal>' +
      '</ogc:PropertyIsLike>' +
      '</ogc:And>' +
      '</filter>' +
      '</filters>';
  var id = goog.string.getRandomString();
  var xmlFilters = goog.dom.xml.loadXml(filters).firstChild;
  var state = new os.state.v2.Filter();

  it('should initialize correctly', function() {
    expect(state.description).toBe('Saves the current filters');
    expect(state.priority).toBe(90);
    expect(state.rootName).toBe(os.state.v2.FilterTag.FILTERS);
    expect(state.title).toBe('Filters');
  });

  it('should load correctly', function() {
    // clear everything out before starting
    os.ui.queryManager = os.query.QueryManager.getInstance();
    os.ui.areaManager = os.query.AreaManager.getInstance();
    os.ui.filterManager = os.query.FilterManager.getInstance();
    os.ui.queryManager.removeEntries();
    os.ui.areaManager.clear();
    os.ui.filterManager.clear();

    expect(goog.object.getCount(os.ui.filterManager.types)).toBe(0);
    expect(os.ui.queryManager.entries.length).toBe(0);

    state.load(xmlFilters, id);

    expect(goog.object.getCount(os.ui.filterManager.types)).toBe(1);
    expect(os.ui.filterManager.types[id + 'layer1'].filters.length).toBe(2);
    expect(os.ui.queryManager.entries.length).toBe(2);
    expect(os.state.v2.Filter.ADDED_[id]).not.toBe(null);
    expect(os.state.v2.Filter.ADDED_[id].length).toBe(2);

    // check one of the filters and entries
    var entry = os.ui.queryManager.entries[0];
    expect(entry['layerId']).toBe(id + 'layer1');
    expect(entry['areaId']).toBe('*');
    expect(entry['filterId']).toBe(id + 'filter1');
    expect(entry['includeArea']).toBe(true);
    expect(entry['filterGroup']).toBe(false);

    var filterEntry = os.ui.filterManager.types[id + 'layer1'].filters[0];
    expect(filterEntry.getTitle()).toBe('Title 1');
    expect(filterEntry.getMatch()).toBe(false);
    expect(filterEntry.type).toBe(id + 'layer1');
  });

  it('should remove correctly', function() {
    // check that we start where we expect to be
    expect(os.ui.filterManager.types[id + 'layer1'].filters.length).toBe(2);
    expect(os.ui.queryManager.entries.length).toBe(2);
    expect(os.state.v2.Filter.ADDED_[id].length).toBe(2);

    state.remove(id);

    // and now everything has been removed
    expect(os.ui.filterManager.types[id + 'layer1'].filters.length).toBe(0);
    expect(os.ui.queryManager.entries.length).toBe(0);
    expect(os.state.v2.Filter.ADDED_[id]).toBe(undefined);
  });

  it('should save correctly', function() {
    os.ui.queryManager.removeEntries();
    os.ui.areaManager.clear();
    os.ui.filterManager.clear();

    var options = {
      doc: goog.dom.xml.createDocument()
    };
    var rootObj = os.xml.createElement(os.state.v2.FilterTag.FILTERS);

    var filter1Xml = '<And xmlns="http://www.opengis.net/ogc" namehint="Filter 1">' +
        '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
        '<PropertyName>Altitude</PropertyName>' +
        '<Literal>9999</Literal>' +
        '</PropertyIsLike>' +
        '</And>';
    var filter1 = new os.filter.FilterEntry();
    filter1.setTitle('Filter 1');
    filter1.type = 'layer1';
    filter1.setFilter(filter1Xml);
    filter1.setId('filter1');

    var filter2Xml = '<And xmlns="http://www.opengis.net/ogc" namehint="Filter 2">' +
        '<PropertyIsNull>' +
        '<PropertyName>Speed</PropertyName>' +
        '</PropertyIsNull>' +
        '</And>';
    var filter2 = new os.filter.FilterEntry();
    filter2.setTitle('Filter 2');
    filter2.type = 'layer1';
    filter2.setFilter(filter2Xml);
    filter2.setId('filter2');

    os.ui.queryManager.addEntry('layer1', 'area1', 'filter1', true, true);
    os.ui.queryManager.addEntry('layer1', 'area1', 'filter2', true, false);

    os.ui.filterManager.addFilter(filter1);
    os.ui.filterManager.addFilter(filter2);

    // spy on dataManager and replace getSources with a simple function call (filterstate depends on it)
    spyOn(os.dataManager, 'getSources').andCallFake(function() {
      return [{
        getId: function() {
          return 'layer1';
        }
      }];
    });

    state.saveInternal(options, rootObj);

    expect(goog.dom.getChildren(rootObj).length).toBe(2);

    var filters = rootObj.querySelectorAll(os.state.v2.FilterTag.FILTER);

    // check one
    var filter = filters[0];
    expect(filter.getAttribute('id')).toBe('filter1');
    expect(filter.getAttribute('active')).toBe('true');
    expect(filter.getAttribute('title')).toBe('Filter 1');
    expect(filter.getAttribute('type')).toBe('layer1');
    expect(filter.getAttribute('match')).toBe('AND');
  });
});
