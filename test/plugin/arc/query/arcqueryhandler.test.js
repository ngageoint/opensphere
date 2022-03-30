goog.require('os.filter.FilterEntry');
goog.require('os.mock');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('plugin.arc.query.ArcQueryHandler');

import Feature from 'ol/src/Feature.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('plugin.arc.query.ArcQueryHandler', function() {
  const {default: FilterEntry} = goog.module.get('os.filter.FilterEntry');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: FilterManager} = goog.module.get('os.query.FilterManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {default: ArcQueryHandler} = goog.module.get('plugin.arc.query.ArcQueryHandler');

  var filterXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>PROPERTY</PropertyName>' +
      '<Literal>Aaa*</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var noWildcardFilterXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>PROPERTY</PropertyName>' +
      '<Literal>Aaa</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var otherXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Muh Other Filter">' +
      '<PropertyIsEqualTo escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>NAME</PropertyName>' +
      '<Literal>Namerino</Literal>' +
      '</PropertyIsEqualTo>' +
      '<PropertyIsNull>' +
      '<PropertyName>RF</PropertyName>' +
      '</PropertyIsNull>' +
      '</And>';

  it('should create arc filters', function() {
    var handler = new ArcQueryHandler();
    spyOn(QueryManager.getInstance(), 'getEntries').andCallFake(function() {
      return [{
        'layerId': 'myArcLayer',
        'filterId': 'myFilterId',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': true
      }];
    });

    // spy on the area manager getter so that it gets my area
    var area = new Feature();
    var geom = new Polygon([[[50, 60], [30, 40], [20, 10], [50, 60]]]);
    area.setGeometry(geom);
    area.setId('myAreaId');
    area.set('shown', true);
    spyOn(AreaManager.getInstance(), 'get').andCallFake(function() {
      return area;
    });

    // spy on the filter manager getter so that it gets my filter
    var filter = new FilterEntry();
    filter.setId('myFilterId');
    filter.setFilter(filterXml);
    filter.setEnabled(true);
    spyOn(FilterManager.getInstance(), 'getFilter').andCallFake(function() {
      return filter;
    });

    var createdFilter = handler.createFilter();
    expect(createdFilter).toBe('(UPPER(PROPERTY) like \'AAA%\')');
  });


  it('should create arc filters for is like with no wildcards', function() {
    var handler = new ArcQueryHandler();
    spyOn(QueryManager.getInstance(), 'getEntries').andCallFake(function() {
      return [{
        'layerId': 'myArcLayer',
        'filterId': 'myFilterId',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': true
      }];
    });

    // spy on the area manager getter so that it gets my area
    var area = new Feature();
    var geom = new Polygon([[[50, 60], [30, 40], [20, 10], [50, 60]]]);
    area.setGeometry(geom);
    area.setId('myAreaId');
    area.set('shown', true);
    spyOn(AreaManager.getInstance(), 'get').andCallFake(function() {
      return area;
    });

    // spy on the filter manager getter so that it gets my filter
    var filter = new FilterEntry();
    filter.setId('myFilterId');
    filter.setFilter(noWildcardFilterXml);
    filter.setEnabled(true);
    spyOn(FilterManager.getInstance(), 'getFilter').andCallFake(function() {
      return filter;
    });

    var createdFilter = handler.createFilter();
    expect(createdFilter).toBe('(UPPER(PROPERTY) like \'%AAA%\')');
  });


  it('should use the grouping of the first filter', function() {
    var handler = new ArcQueryHandler();
    spyOn(QueryManager.getInstance(), 'getEntries').andCallFake(function() {
      return [{
        'layerId': 'myArcLayer',
        'filterId': 'myOrFilter',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': false
      }, {
        'layerId': 'myArcLayer',
        'filterId': 'myAndFilter',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': true
      }];
    });

    // spy on the area manager getter so that it gets my area
    var area = new Feature();
    var geom = new Polygon([[[50, 60], [30, 40], [20, 10], [50, 60]]]);
    area.setGeometry(geom);
    area.setId('myAreaId');
    area.set('shown', true);
    spyOn(AreaManager.getInstance(), 'get').andCallFake(function() {
      return area;
    });

    // spy on the filter manager getter so that it gets my filter
    var orFilter = new FilterEntry();
    orFilter.setId('myFilterId');
    orFilter.setFilter(filterXml);
    orFilter.setEnabled(true);
    var andFilter = new FilterEntry();
    andFilter.setId('myFilterId2');
    andFilter.setFilter(otherXml);
    andFilter.setEnabled(true);

    var filters = {
      'myOrFilter': orFilter,
      'myAndFilter': andFilter
    };

    spyOn(FilterManager.getInstance(), 'getFilter').andCallFake(function(id) {
      return filters[id];
    });

    var createdFilter = handler.createFilter();
    expect(createdFilter).toBe('(UPPER(PROPERTY) like \'AAA%\') OR (NAME = \'Namerino\' AND RF = \'\' or RF is null)');
  });
});
