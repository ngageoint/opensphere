goog.require('os.xml');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.state.v2.QueryEntries');
goog.require('os.state.v2.QueryEntriesTag');


describe('os.state.v2.QueryEntries', function() {
  var queryEntries = '<queryEntries>' +
      '<queryEntry layerId="layer1" areaId="area1" filterId="filter1" includeArea="true" filterGroup="false"/>' +
      '<queryEntry layerId="layer1" areaId="area1" filterId="filter2" includeArea="true" filterGroup="false"/>' +
      '<queryEntry layerId="layer1" areaId="area2" filterId="*" includeArea="false" filterGroup="true"/>' +
      '<queryEntry layerId="layer2" areaId="area1" filterId="*" includeArea="true" filterGroup="true"/>' +
      '<queryEntry layerId="layer2" areaId="area2" filterId="*" includeArea="true" filterGroup="true"/>' +
      '</queryEntries>';
  var id = goog.string.getRandomString();
  var xmlEntries = goog.dom.xml.loadXml(queryEntries).firstChild;
  var state = new os.state.v2.QueryEntries();

  it('should initialize correctly', function() {
    expect(state.description).toBe('Saves the query combinations');
    expect(state.priority).toBe(90);
    expect(state.rootName).toBe(os.state.v2.QueryEntriesTag.QUERY_ENTRIES);
    expect(state.title).toBe('Query Entries');
  });

  it('should load correctly', function() {
    // clear everything out
    os.ui.queryManager = os.query.QueryManager.getInstance();
    os.ui.areaManager = os.query.AreaManager.getInstance();
    os.ui.filterManager = os.query.FilterManager.getInstance();
    os.ui.queryManager.removeEntries();
    os.ui.areaManager.clear();
    os.ui.filterManager.clear();

    expect(os.ui.queryManager.entries.length).toBe(0);

    state.load(xmlEntries, id);

    expect(os.ui.queryManager.entries.length).toBe(5);
    expect(os.state.v2.QueryEntries.ADDED_[id]).not.toBe(null);
    expect(os.state.v2.QueryEntries.ADDED_[id].length).toBe(5);

    // check one of the entries
    var entry = os.ui.queryManager.entries[0];
    expect(entry['layerId']).toBe(id + 'layer1');
    expect(entry['areaId']).toBe(id + 'area1');
    expect(entry['filterId']).toBe(id + 'filter1');
    expect(entry['includeArea']).toBe(true);
    expect(entry['filterGroup']).toBe(false);
  });

  it('should remove correctly', function() {
    expect(os.ui.queryManager.entries.length).toBe(5);
    expect(os.state.v2.QueryEntries.ADDED_[id].length).toBe(5);
    state.remove(id);
    expect(os.ui.queryManager.entries.length).toBe(0);
    expect(os.state.v2.QueryEntries.ADDED_[id]).toBe(undefined);
  });

  it('should save correctly', function() {
    os.ui.queryManager.removeEntries();

    var options = {
      doc: goog.dom.xml.createDocument()
    };
    var rootObj = os.xml.createElement('queryEntries');

    // replace the getActiveEntries call with one that doesn't depend on areaManager and filterManager
    spyOn(os.ui.queryManager, 'getActiveEntries').andCallFake(function() {
      return os.ui.queryManager.expandedEntries;
    });

    runs(function() {
      os.ui.queryManager.addEntry('layer1', 'area1', 'filter1', true, true);
      os.ui.queryManager.addEntry('layer2', 'area1', 'filter1', true, false);
      os.ui.queryManager.addEntry('layer2', 'area2', 'filter2', true, false);
    });

    waitsFor(function() {
      return os.ui.queryManager.expandedEntries.length == 3;
    }, 'queryManager to expand its new entries');

    runs(function() {
      state.saveInternal(options, rootObj);

      expect(goog.dom.getChildren(rootObj).length).toBe(3);

      var queryEntries = rootObj.querySelectorAll(os.state.v2.QueryEntriesTag.QUERY_ENTRY);

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
    os.ui.queryManager.removeEntries();
    os.ui.queryManager.expandedEntries = [];

    var options = {
      doc: goog.dom.xml.createDocument()
    };
    var rootObj = os.xml.createElement('queryEntries');

    spyOn(os.ui.queryManager, 'getActiveEntries').andCallFake(function() {
      return os.ui.queryManager.expandedEntries;
    });

    runs(function() {
      os.ui.queryManager.addEntry('*', 'area1', 'filter1', true, true);
      os.ui.queryManager.addEntry('layer2', 'area1', 'filter1', true, false);
    });

    waitsFor(function() {
      return os.ui.queryManager.expandedEntries.length != 0;
    }, 'queryManager to expand its new entries');

    runs(function() {
      state.saveInternal(options, rootObj);

      // it should exclude the first entry
      expect(goog.dom.getChildren(rootObj).length).toBe(1);

      var queryEntries = rootObj.querySelectorAll(os.state.v2.QueryEntriesTag.QUERY_ENTRY);

      // check one
      var entry = queryEntries[0];
      expect(entry.getAttribute('layerId')).toBe('layer2');
      expect(entry.getAttribute('areaId')).toBe('area1');
      expect(entry.getAttribute('filterId')).toBe('filter1');
      expect(entry.getAttribute('includeArea')).toBe('true');
      expect(entry.getAttribute('filterGroup')).toBe('false');
    });
  });
});
