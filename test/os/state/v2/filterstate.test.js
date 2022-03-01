goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('goog.string');
goog.require('os.data.DataManager');
goog.require('os.filter.FilterEntry');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.state.v2.Filter');
goog.require('os.state.v2.FilterTag');
goog.require('os.xml');


describe('os.state.v2.Filter', function() {
  const dom = goog.module.get('goog.dom');
  const googDomXml = goog.module.get('goog.dom.xml');
  const googObject = goog.module.get('goog.object');
  const googString = goog.module.get('goog.string');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: FilterEntry} = goog.module.get('os.filter.FilterEntry');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: FilterManager} = goog.module.get('os.query.FilterManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {default: Filter} = goog.module.get('os.state.v2.Filter');
  const {default: FilterTag} = goog.module.get('os.state.v2.FilterTag');
  const xml = goog.module.get('os.xml');

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
  var id = googString.getRandomString();
  var xmlFilters = googDomXml.loadXml(filters).firstChild;
  var state = new Filter();

  const resetManagers = () => {
    QueryManager.getInstance().removeEntries();
    AreaManager.getInstance().clear();
    FilterManager.getInstance().clear();
  };

  it('should initialize correctly', function() {
    expect(state.description).toBe('Saves the current filters');
    expect(state.priority).toBe(90);
    expect(state.rootName).toBe(FilterTag.FILTERS);
    expect(state.title).toBe('Filters');
  });

  it('should load correctly', function() {
    // clear everything out before starting
    resetManagers();

    expect(googObject.getCount(FilterManager.getInstance().types)).toBe(0);
    expect(QueryManager.getInstance().entries.length).toBe(0);

    state.load(xmlFilters, id);

    expect(googObject.getCount(FilterManager.getInstance().types)).toBe(1);
    expect(FilterManager.getInstance().types[id + 'layer1'].filters.length).toBe(2);
    expect(QueryManager.getInstance().entries.length).toBe(2);
    expect(Filter.getAddedEntries()[id]).not.toBe(null);
    expect(Filter.getAddedEntries()[id].length).toBe(2);

    // check one of the filters and entries
    var entry = QueryManager.getInstance().entries[0];
    expect(entry['layerId']).toBe(id + 'layer1');
    expect(entry['areaId']).toBe('*');
    expect(entry['filterId']).toBe(id + 'filter1');
    expect(entry['includeArea']).toBe(true);
    expect(entry['filterGroup']).toBe(false);

    var filterEntry = FilterManager.getInstance().types[id + 'layer1'].filters[0];
    expect(filterEntry.getTitle()).toBe('Title 1');
    expect(filterEntry.getMatch()).toBe(false);
    expect(filterEntry.type).toBe(id + 'layer1');
  });

  it('should remove correctly', function() {
    // check that we start where we expect to be
    expect(FilterManager.getInstance().types[id + 'layer1'].filters.length).toBe(2);
    expect(QueryManager.getInstance().entries.length).toBe(2);
    expect(Filter.getAddedEntries()[id].length).toBe(2);

    state.remove(id);

    // and now everything has been removed
    expect(FilterManager.getInstance().types[id + 'layer1'].filters.length).toBe(0);
    expect(QueryManager.getInstance().entries.length).toBe(0);
    expect(Filter.getAddedEntries()[id]).toBe(undefined);
  });

  it('should save correctly', function() {
    resetManagers();

    var options = {
      doc: googDomXml.createDocument()
    };
    var rootObj = xml.createElement(FilterTag.FILTERS);

    var filter1Xml = '<And xmlns="http://www.opengis.net/ogc" namehint="Filter 1">' +
        '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
        '<PropertyName>Altitude</PropertyName>' +
        '<Literal>9999</Literal>' +
        '</PropertyIsLike>' +
        '</And>';
    var filter1 = new FilterEntry();
    filter1.setTitle('Filter 1');
    filter1.type = 'layer1';
    filter1.setFilter(filter1Xml);
    filter1.setId('filter1');

    var filter2Xml = '<And xmlns="http://www.opengis.net/ogc" namehint="Filter 2">' +
        '<PropertyIsNull>' +
        '<PropertyName>Speed</PropertyName>' +
        '</PropertyIsNull>' +
        '</And>';
    var filter2 = new FilterEntry();
    filter2.setTitle('Filter 2');
    filter2.type = 'layer1';
    filter2.setFilter(filter2Xml);
    filter2.setId('filter2');

    QueryManager.getInstance().addEntry('layer1', 'area1', 'filter1', true, true);
    QueryManager.getInstance().addEntry('layer1', 'area1', 'filter2', true, false);

    FilterManager.getInstance().addFilter(filter1);
    FilterManager.getInstance().addFilter(filter2);

    // spy on dataManager and replace getSources with a simple function call (filterstate depends on it)
    spyOn(DataManager.getInstance(), 'getSources').andCallFake(function() {
      return [{
        getId: function() {
          return 'layer1';
        }
      }];
    });

    state.saveInternal(options, rootObj);

    expect(dom.getChildren(rootObj).length).toBe(2);

    var filters = rootObj.querySelectorAll(FilterTag.FILTER);

    // check one
    var filter = filters[0];
    expect(filter.getAttribute('id')).toBe('filter1');
    expect(filter.getAttribute('active')).toBe('true');
    expect(filter.getAttribute('title')).toBe('Filter 1');
    expect(filter.getAttribute('type')).toBe('layer1');
    expect(filter.getAttribute('match')).toBe('AND');
  });
});
