goog.require('os.ogc.wfs.FeatureType');


describe('os.ogc.wfs.FeatureType', function() {
  it('should detect geometry columns', function() {
    var cols = [
      {name: 'Title', type: 'string'},
      {name: 'GEOM', type: 'string'},
      {name: 'BestShapeEVER', type: 'gml:Polygon'}
    ];

    var type = new os.ogc.wfs.FeatureType('yermom', cols);
    expect(type.getGeometryColumnName()).toBe('BestShapeEVER');
  });

  it('should detect single time fields', function() {
    var cols = [
      {name: 'Title', type: 'string'},
      {name: 'GEOM', type: 'gml:Point'},
      {name: 'moment', type: 'datetime'}
    ];

    var type = new os.ogc.wfs.FeatureType('yermom', cols);
    expect(type.getStartDateColumnName()).toBe('moment');
    expect(type.getEndDateColumnName()).toBe('moment');
  });

  it('should use the first of many single time fields (iterating from the right)', function() {
    var cols = [
      {name: 'Title', type: 'string'},
      {name: 'GEOM', type: 'gml:Point'},
      {name: 'startdt1', type: 'datetime'},
      {name: 'startdt2', type: 'datetime'},
      {name: 'enddt1', type: 'datetime'},
      {name: 'enddt2', type: 'datetime'}
    ];

    var type = new os.ogc.wfs.FeatureType('yermom', cols, true);
    expect(type.getStartDateColumnName()).toBe('startdt2');
    expect(type.getEndDateColumnName()).toBe('enddt2');
  });

  it('should default to validTime for dynamic types', function() {
    var cols = [
      {name: 'Title', type: 'string'},
      {name: 'GEOM', type: 'gml:Point'}
    ];

    var type = new os.ogc.wfs.FeatureType('yermom', cols, true);
    expect(type.getStartDateColumnName()).toBe('validTime');
    expect(type.getEndDateColumnName()).toBe('validTime');
  });

  it('should detect start/end dates', function() {
    var cols = [
      {name: 'Title', type: 'string'},
      {name: 'GEOM', type: 'gml:Point'},
      {name: 'startDate', type: 'datetime'},
      {name: 'moment3', type: 'datetime'},
      {name: 'stopDate', type: 'datetime'}
    ];

    var type = new os.ogc.wfs.FeatureType('yermom', cols, true);
    expect(type.getStartDateColumnName()).toBe('startDate');
    expect(type.getEndDateColumnName()).toBe('stopDate');
  });

  it('should use explicitly-set start end dates for individual feature types', function() {
    os.ogc.wfs.FeatureType.setTimeColumns('yermom', 'moment3', 'moment2');

    var cols = [
      {name: 'Title', type: 'string'},
      {name: 'GEOM', type: 'gml:Point'},
      {name: 'moment', type: 'datetime'},
      {name: 'moment2', type: 'datetime'},
      {name: 'moment3', type: 'datetime'}
    ];

    var type = new os.ogc.wfs.FeatureType('yermom', cols, true);
    expect(type.getStartDateColumnName()).toBe('moment3');
    expect(type.getEndDateColumnName()).toBe('moment2');

    os.ogc.wfs.FeatureType.removeTimeColumns('yermom', 'moment3', 'moment2');
  });
});
