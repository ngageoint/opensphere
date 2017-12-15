goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('plugin.arc.ArcJSONParser');


describe('plugin.arc.ArcJSONParser', function() {
  it('should add new features to its parse queue if they are added separately', function() {
    var parser = new plugin.arc.ArcJSONParser();
    var source1 = '{"displayFieldName": "full_name","features": [{"attributes": {"full_name": "wutface","type": "meme"},"geometry": {"x": 38,"y": 34}},{"attributes": {"full_name": "kappa","type": "meme"},"geometry": {"x": 31,"y": 33}},{"attributes": {"full_name": "elegiggle","type": "meme"},"geometry": {"x": -331,"y": 85}}]}';
    var source2 = '{"displayFieldName": "full_name","features": [{"attributes": {"full_name": "4head","type": "meme"},"geometry": {"x": 38,"y": 34}},{"attributes": {"full_name": "LUL","type": "meme"},"geometry": {"x": 31,"y": 33}},{"attributes": {"full_name": "babyrage","type": "meme"},"geometry": {"x": -331,"y": 85}}]}';
    parser.setSource(source1);
    expect(parser.features_.length).toBe(3);
    parser.setSource(source2);
    expect(parser.features_.length).toBe(6);
  });

  it('should parse Arc point geometries', function() {
    var parser = new plugin.arc.ArcJSONParser();
    var arcPoint = {
      'x': 99,
      'y': -30
    };

    var olGeom = parser.parsePointGeometry_(arcPoint);
    expect(olGeom instanceof ol.geom.Point).toBe(true);
    expect(olGeom.getCoordinates()[0]).toBe(99);
    expect(olGeom.getCoordinates()[1]).toBe(-30);
  });

  it('should parse Arc linestring geometries', function() {
    var parser = new plugin.arc.ArcJSONParser();
    var arcLineString = {
      'paths': [
        [
          [4, 10],
          [6, 8],
          [30, 20],
          [9, 10]
        ]
      ]
    };

    var olGeom = parser.parseLineStringGeometry_(arcLineString);
    expect(olGeom instanceof ol.geom.LineString).toBe(true);
    expect(olGeom.getCoordinates()[1][0]).toBe(6);
    expect(olGeom.getCoordinates()[1][1]).toBe(8);
    expect(olGeom.getCoordinates()[3][0]).toBe(9);
  });

  it('should parse Arc polygon geometries', function() {
    var parser = new plugin.arc.ArcJSONParser();
    var arcPolygon = {
      'rings': [
        [
          [0, 18],
          [-32, 5],
          [-56, 56],
          [0, 18]
        ],
        [
          [-185, 290],
          [30, 50],
          [80, -20],
          [-185, 290]
        ]
      ]
    };

    var olGeom = parser.parsePolygonGeometry_(arcPolygon);
    expect(olGeom instanceof ol.geom.Polygon).toBe(true);
    expect(olGeom.getCoordinates()[0][0][0]).toBe(0);
    expect(olGeom.getCoordinates()[0][0][1]).toBe(18);
    expect(olGeom.getCoordinates()[0][3][0]).toBe(0);
    expect(olGeom.getCoordinates()[0][3][1]).toBe(18);

    expect(olGeom.getCoordinates()[1][0][0]).toBe(-185);
    expect(olGeom.getCoordinates()[1][0][1]).toBe(290);
    expect(olGeom.getCoordinates()[1][2][1]).toBe(-20);
    expect(olGeom.getCoordinates()[1][1][1]).toBe(50);
  });

  it('should parse Arc multipoint geometries', function() {
    var parser = new plugin.arc.ArcJSONParser();
    var arcMultiPoint = {
      'points': [
        [0, 18],
        [-32, 5],
        [-56, 56],
        [0, 18],
        [-185, 290],
        [30, 50],
        [80, -20],
        [-185, 290]
      ]
    };

    var olGeom = parser.parseMultiPointGeometry_(arcMultiPoint);
    expect(olGeom instanceof ol.geom.MultiPoint).toBe(true);
    expect(olGeom.getCoordinates()[0][1]).toBe(18);
    expect(olGeom.getCoordinates()[3][0]).toBe(0);
    expect(olGeom.getCoordinates()[5][1]).toBe(50);
    expect(olGeom.getCoordinates()[7][0]).toBe(-185);
  });

  it('should parse Arc BBOX geometries', function() {
    var parser = new plugin.arc.ArcJSONParser();
    var arcBBOX = {
      'xmin': 9,
      'xmax': 10,
      'ymin': 11,
      'ymax': 12
    };

    var olGeom = parser.parseBBOXGeometry_(arcBBOX);
    expect(olGeom instanceof ol.geom.Polygon).toBe(true);
    expect(olGeom.getCoordinates()[0][0][0]).toBe(9);
    expect(olGeom.getCoordinates()[0][0][1]).toBe(11);
    expect(olGeom.getCoordinates()[0][2][0]).toBe(10);
    expect(olGeom.getCoordinates()[0][2][1]).toBe(12);
    expect(olGeom.getCoordinates()[0][4][0]).toBe(9);
    expect(olGeom.getCoordinates()[0][4][1]).toBe(11);
  });
});
