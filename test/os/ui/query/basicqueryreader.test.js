goog.require('goog.dom.xml');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('os.filter.BaseFilterManager');
goog.require('os.interpolate');
goog.require('os.interpolate.Method');
goog.require('os.mock');
goog.require('os.query.AreaManager');
goog.require('os.query.BaseAreaManager');
goog.require('os.query.BaseQueryManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.ui.query.BasicQueryReader');

import Polygon from 'ol/src/geom/Polygon.js';

describe('os.ui.query.BasicQueryReader', function() {
  const xml = goog.module.get('goog.dom.xml');
  const EventType = goog.module.get('goog.net.EventType');
  const XhrIo = goog.module.get('goog.net.XhrIo');
  const googObject = goog.module.get('goog.object');
  const interpolate = goog.module.get('os.interpolate');
  const {default: Method} = goog.module.get('os.interpolate.Method');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: FilterManager} = goog.module.get('os.query.FilterManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {default: BasicQueryReader} = goog.module.get('os.ui.query.BasicQueryReader');

  var basicQueryUrl = '/base/test/os/ui/query/basicquery.xml';

  afterEach(function() {
    FilterManager.getInstance().clear();
    AreaManager.getInstance().clear();
    QueryManager.getInstance().removeEntries();
  });

  it('should properly load a basic query', function() {
    var query = null;
    var xhr = new XhrIo();
    xhr.listen(EventType.SUCCESS, function() {
      query = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(basicQueryUrl);
    });

    waitsFor(function() {
      return query != null;
    }, 'test query to load');

    runs(function() {
      FilterManager.getInstance().clear();
      AreaManager.getInstance().clear();
      QueryManager.getInstance().removeEntries();

      expect(googObject.getCount(FilterManager.getInstance().types)).toBe(0);
      expect(AreaManager.getInstance().items_.length).toBe(0);
      expect(QueryManager.getInstance().entries.length).toBe(0);

      var doc = xml.loadXml(query);
      var queryElement = doc.firstChild;
      var qr = new BasicQueryReader();
      qr.setLayerId('SOME_LAYER');
      qr.setFilter(queryElement);
      qr.parseEntries();

      // check the filter manager
      expect(googObject.getCount(FilterManager.getInstance().types)).toBe(1);
      var type = FilterManager.getInstance().types['SOME_LAYER'];
      expect(type).not.toBe(null);
      expect(type.and).toBe(false);
      expect(type.filters.length).toBe(1);
      var filter = type.filters[0];
      expect(filter.getTitle()).toBe('1 Billion Dollars');
      expect(filter.type).toBe('SOME_LAYER');
      expect(filter.getDescription()).toBe('This is an advanced filter of some kind');

      // check the area manager
      expect(AreaManager.getInstance().items_.length).toBe(1);
      var area = AreaManager.getInstance().items_[0];
      expect(area.get('title')).toBe('Some Area');
      expect(area.get('description')).toBe('Some Description');
      expect(area.getId()).toBe('&ID');
      expect(area.get(interpolate.METHOD_FIELD)).toBe(Method.NONE);
      expect(area.get('temp')).toBe(true);
      expect(area.get('shown')).toBe(true);
      var geometry = area.getGeometry();
      expect(geometry instanceof Polygon).toBe(true);
      expect(geometry.getFlatCoordinates().length).toBe(60);

      // check the query manager
      expect(QueryManager.getInstance().entries.length).toBe(2);
      var e1 = QueryManager.getInstance().entries[0];
      expect(e1['areaId']).toBe('*');
      expect(e1['filterGroup']).toBe(false);
      expect(e1['filterId']).toBe(filter.getId());
      expect(e1['includeArea']).toBe(true);
      expect(e1['layerId']).toBe('SOME_LAYER');
      var e2 = QueryManager.getInstance().entries[1];
      expect(e2['areaId']).toBe(area.getId());
      expect(e2['filterGroup']).toBe(true); // filter group is irrelevant to an area entry from the basic reader
      expect(e2['filterId']).toBe('*');
      expect(e2['includeArea']).toBe(true);
      expect(e2['layerId']).toBe('SOME_LAYER');
    });
  });
});
