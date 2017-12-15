goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('ol.geom.Polygon');
goog.require('os.mock');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.query.BasicQueryReader');
goog.require('os.ui.query.QueryManager');


describe('os.ui.query.BasicQueryReader', function() {
  var basicQueryUrl = '/base/test/os/ui/query/basicquery.xml';

  afterEach(function() {
    os.ui.filterManager.clear();
    os.ui.areaManager.clear();
    os.ui.queryManager.removeEntries();
  });

  it('should properly load a basic query', function() {
    var query = null;
    var xhr = new goog.net.XhrIo();
    xhr.listen(goog.net.EventType.SUCCESS, function() {
      query = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(basicQueryUrl);
    });

    waitsFor(function() {
      return query != null;
    }, 'test query to load');

    runs(function() {
      os.ui.filterManager.clear();
      os.ui.areaManager.clear();
      os.ui.queryManager.removeEntries();

      expect(goog.object.getCount(os.ui.filterManager.types)).toBe(0);
      expect(os.ui.areaManager.items_.length).toBe(0);
      expect(os.ui.queryManager.entries.length).toBe(0);

      var doc = goog.dom.xml.loadXml(query);
      var queryElement = doc.firstChild;
      var qr = new os.ui.query.BasicQueryReader();
      qr.setLayerId('SOME_LAYER');
      qr.setFilter(queryElement);
      qr.parseEntries();

      // check the filter manager
      expect(goog.object.getCount(os.ui.filterManager.types)).toBe(1);
      var type = os.ui.filterManager.types['SOME_LAYER'];
      expect(type).not.toBe(null);
      expect(type.and).toBe(false);
      expect(type.filters.length).toBe(1);
      var filter = type.filters[0];
      expect(filter.getTitle()).toBe('1 Billion Dollars');
      expect(filter.type).toBe('SOME_LAYER');
      expect(filter.getDescription()).toBe('This is an advanced filter of some kind');

      // check the area manager
      expect(os.ui.areaManager.items_.length).toBe(1);
      var area = os.ui.areaManager.items_[0];
      expect(area.get('title')).toBe('Some Area');
      expect(area.get('description')).toBe('Some Description');
      expect(area.get(os.interpolate.METHOD_FIELD)).toBe(os.interpolate.Method.NONE);
      expect(area.get('temp')).toBe(true);
      expect(area.get('shown')).toBe(true);
      var geometry = area.getGeometry();
      expect(geometry instanceof ol.geom.Polygon).toBe(true);
      expect(geometry.getFlatCoordinates().length).toBe(60);

      // check the query manager
      expect(os.ui.queryManager.entries.length).toBe(2);
      var e1 = os.ui.queryManager.entries[0];
      expect(e1['areaId']).toBe('*');
      expect(e1['filterGroup']).toBe(false);
      expect(e1['filterId']).toBe(filter.getId());
      expect(e1['includeArea']).toBe(true);
      expect(e1['layerId']).toBe('SOME_LAYER');
      var e2 = os.ui.queryManager.entries[1];
      expect(e2['areaId']).toBe(area.getId());
      expect(e2['filterGroup']).toBe(true); // filter group is irrelevant to an area entry from the basic reader
      expect(e2['filterId']).toBe('*');
      expect(e2['includeArea']).toBe(true);
      expect(e2['layerId']).toBe('SOME_LAYER');
    });
  });
});
