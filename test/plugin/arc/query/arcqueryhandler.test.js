goog.require('os.mock');
goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('plugin.arc.query.ArcQueryHandler');


describe('plugin.arc.query.ArcQueryHandler', function() {
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
    var handler = new plugin.arc.query.ArcQueryHandler();
    spyOn(os.ui.queryManager, 'getEntries').andCallFake(function() {
      return [{
        'layerId': 'myArcLayer',
        'filterId': 'myFilterId',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': true
      }];
    });

    // spy on the area manager getter so that it gets my area
    var area = new ol.Feature();
    var geom = new ol.geom.Polygon([[[50, 60], [30, 40], [20, 10], [50, 60]]]);
    area.setGeometry(geom);
    area.setId('myAreaId');
    area.set('shown', true);
    spyOn(os.ui.areaManager, 'get').andCallFake(function() {
      return area;
    });

    // spy on the filter manager getter so that it gets my filter
    var filter = new os.filter.FilterEntry();
    filter.setId('myFilterId');
    filter.setFilter(filterXml);
    filter.setEnabled(true);
    spyOn(os.ui.filterManager, 'getFilter').andCallFake(function() {
      return filter;
    });

    var createdFilter = handler.createFilter();
    expect(createdFilter).toBe('(UPPER(PROPERTY) like \'AAA%\')');
  });


  it('should create arc filters for is like with no wildcards', function() {
    var handler = new plugin.arc.query.ArcQueryHandler();
    spyOn(os.ui.queryManager, 'getEntries').andCallFake(function() {
      return [{
        'layerId': 'myArcLayer',
        'filterId': 'myFilterId',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': true
      }];
    });

    // spy on the area manager getter so that it gets my area
    var area = new ol.Feature();
    var geom = new ol.geom.Polygon([[[50, 60], [30, 40], [20, 10], [50, 60]]]);
    area.setGeometry(geom);
    area.setId('myAreaId');
    area.set('shown', true);
    spyOn(os.ui.areaManager, 'get').andCallFake(function() {
      return area;
    });

    // spy on the filter manager getter so that it gets my filter
    var filter = new os.filter.FilterEntry();
    filter.setId('myFilterId');
    filter.setFilter(noWildcardFilterXml);
    filter.setEnabled(true);
    spyOn(os.ui.filterManager, 'getFilter').andCallFake(function() {
      return filter;
    });

    var createdFilter = handler.createFilter();
    expect(createdFilter).toBe('(UPPER(PROPERTY) like \'%AAA%\')');
  });


  it('should use the grouping of the first filter', function() {
    var handler = new plugin.arc.query.ArcQueryHandler();
    spyOn(os.ui.queryManager, 'getEntries').andCallFake(function() {
      return [{
        'layerId': 'myArcLayer',
        'filterId': 'myOrFilter',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': false
      },{
        'layerId': 'myArcLayer',
        'filterId': 'myAndFilter',
        'areaId': 'myAreaId',
        'includeArea': true,
        'filterGroup': true
      }];
    });

    // spy on the area manager getter so that it gets my area
    var area = new ol.Feature();
    var geom = new ol.geom.Polygon([[[50, 60], [30, 40], [20, 10], [50, 60]]]);
    area.setGeometry(geom);
    area.setId('myAreaId');
    area.set('shown', true);
    spyOn(os.ui.areaManager, 'get').andCallFake(function() {
      return area;
    });

    // spy on the filter manager getter so that it gets my filter
    var orFilter = new os.filter.FilterEntry();
    orFilter.setId('myFilterId');
    orFilter.setFilter(filterXml);
    orFilter.setEnabled(true);
    var andFilter = new os.filter.FilterEntry();
    andFilter.setId('myFilterId2');
    andFilter.setFilter(otherXml);
    andFilter.setEnabled(true);

    var filters = {
      'myOrFilter': orFilter,
      'myAndFilter': andFilter
    };

    spyOn(os.ui.filterManager, 'getFilter').andCallFake(function(id) {
      return filters[id];
    });

    var createdFilter = handler.createFilter();
    expect(createdFilter).toBe('(UPPER(PROPERTY) like \'AAA%\') OR (NAME = \'Namerino\' AND RF = \'\' or RF is null)');
  });
});
