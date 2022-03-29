goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.state.v2.QueryEntries');
goog.require('os.state.v2.QueryEntriesTag');
goog.require('os.xml');


describe('os.state.v2.QueryEntries', function() {
  const dom = goog.module.get('goog.dom');
  const googDomXml = goog.module.get('goog.dom.xml');
  const googString = goog.module.get('goog.string');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: FilterManager} = goog.module.get('os.query.FilterManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {default: QueryEntries} = goog.module.get('os.state.v2.QueryEntries');
  const {default: QueryEntriesTag} = goog.module.get('os.state.v2.QueryEntriesTag');
  const xml = goog.module.get('os.xml');

  var queryEntries = '<queryEntries>' +
      '<queryEntry layerId="layer1" areaId="area1" filterId="filter1" includeArea="true" filterGroup="false"/>' +
      '<queryEntry layerId="layer1" areaId="area1" filterId="filter2" includeArea="true" filterGroup="false"/>' +
      '<queryEntry layerId="layer1" areaId="area2" filterId="*" includeArea="false" filterGroup="true"/>' +
      '<queryEntry layerId="layer2" areaId="area1" filterId="*" includeArea="true" filterGroup="true"/>' +
      '<queryEntry layerId="layer2" areaId="area2" filterId="*" includeArea="true" filterGroup="true"/>' +
      '</queryEntries>';
  var id = googString.getRandomString();
  var xmlEntries = googDomXml.loadXml(queryEntries).firstChild;
  var state = new QueryEntries();

  const resetManagers = () => {
    QueryManager.getInstance().removeEntries();
    AreaManager.getInstance().clear();
    FilterManager.getInstance().clear();
  };

  it('should initialize correctly', function() {
    expect(state.description).toBe('Saves the query combinations');
    expect(state.priority).toBe(90);
    expect(state.rootName).toBe(QueryEntriesTag.QUERY_ENTRIES);
    expect(state.title).toBe('Query Entries');
  });

  it('should load correctly', function() {
    // clear everything out before starting
    resetManagers();

    expect(QueryManager.getInstance().entries.length).toBe(0);

    state.load(xmlEntries, id);

    expect(QueryManager.getInstance().entries.length).toBe(5);
    expect(QueryEntries.getAddedEntries()[id]).not.toBe(null);
    expect(QueryEntries.getAddedEntries()[id].length).toBe(5);

    // check one of the entries
    var entry = QueryManager.getInstance().entries[0];
    expect(entry['layerId']).toBe(id + 'layer1');
    expect(entry['areaId']).toBe(id + 'area1');
    expect(entry['filterId']).toBe(id + 'filter1');
    expect(entry['includeArea']).toBe(true);
    expect(entry['filterGroup']).toBe(false);
  });

  it('should remove correctly', function() {
    expect(QueryManager.getInstance().entries.length).toBe(5);
    expect(QueryEntries.getAddedEntries()[id].length).toBe(5);
    state.remove(id);
    expect(QueryManager.getInstance().entries.length).toBe(0);
    expect(QueryEntries.getAddedEntries()[id]).toBe(undefined);
  });

  it('should save correctly', function() {
    QueryManager.getInstance().removeEntries();

    var options = {
      doc: googDomXml.createDocument()
    };
    var rootObj = xml.createElement('queryEntries');

    // replace the getActiveEntries call with one that doesn't depend on areaManager and filterManager
    spyOn(QueryManager.getInstance(), 'getActiveEntries').andCallFake(function() {
      return QueryManager.getInstance().expandedEntries;
    });

    runs(function() {
      QueryManager.getInstance().addEntry('layer1', 'area1', 'filter1', true, true);
      QueryManager.getInstance().addEntry('layer2', 'area1', 'filter1', true, false);
      QueryManager.getInstance().addEntry('layer2', 'area2', 'filter2', true, false);
    });

    waitsFor(function() {
      return QueryManager.getInstance().expandedEntries.length == 3;
    }, 'queryManager to expand its new entries');

    runs(function() {
      state.saveInternal(options, rootObj);

      expect(dom.getChildren(rootObj).length).toBe(3);

      var queryEntries = rootObj.querySelectorAll(QueryEntriesTag.QUERY_ENTRY);

      // check one
      var entry = queryEntries[0];
      expect(entry.getAttribute('layerId')).toBe('layer1');
      expect(entry.getAttribute('areaId')).toBe('area1');
      expect(entry.getAttribute('filterId')).toBe('filter1');
      expect(entry.getAttribute('includeArea')).toBe('true');
      expect(entry.getAttribute('filterGroup')).toBe('true');
    });
  });

  it('should not save entries where layerId = *', function() {
    QueryManager.getInstance().removeEntries();
    QueryManager.getInstance().expandedEntries = [];

    var options = {
      doc: googDomXml.createDocument()
    };
    var rootObj = xml.createElement('queryEntries');

    spyOn(QueryManager.getInstance(), 'getActiveEntries').andCallFake(function() {
      return QueryManager.getInstance().expandedEntries;
    });

    runs(function() {
      QueryManager.getInstance().addEntry('*', 'area1', 'filter1', true, true);
      QueryManager.getInstance().addEntry('queryentriesstate', 'area1', 'filter1', true, false);
    });

    waitsFor(function() {
      return QueryManager.getInstance().expandedEntries.length != 0;
    }, 'queryManager to expand its new entries');

    runs(function() {
      state.saveInternal(options, rootObj);

      var queryEntries = rootObj.querySelectorAll(QueryEntriesTag.QUERY_ENTRY);

      queryEntries.forEach((entry) => {
        if (entry.getAttribute('layerId') == '*') {
          fail('Should not have an entry with an *');
        }

        if (entry.getAttribute('layerId') == 'queryentriesstate') {
          expect(entry.getAttribute('areaId')).toBe('area1');
          expect(entry.getAttribute('filterId')).toBe('filter1');
          expect(entry.getAttribute('includeArea')).toBe('true');
          expect(entry.getAttribute('filterGroup')).toBe('false');
        }
      });
    });
  });
});
