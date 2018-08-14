goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.ui.query.AreaManager');


describe('os.ui.query.AreaManager', function() {
  var am;
  var area;

  beforeEach(function() {
    am = os.ui.areaManager;
    area = new ol.Feature();
  });

  it('tests if areas are valid', function() {
    // no geometry
    expect(am.isValidFeature(area)).toBe(false);

    // points aren't valid
    var point = new ol.geom.Point([0, 0]);
    area.setGeometry(point);
    expect(am.isValidFeature(area)).toBe(false);

    // open lines aren't valid
    var line = new ol.geom.LineString([[0, 0], [1, 1]]);
    area.setGeometry(line);
    expect(am.isValidFeature(area)).toBe(false);

    // non-crossing polygon is valid
    var box = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    area.setGeometry(box);
    expect(am.isValidFeature(area)).toBe(true);

    // non-crossing/overlapping polygon is valid
    var twoBoxes = new ol.geom.MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
      [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
    ]);
    area.setGeometry(twoBoxes);
    expect(am.isValidFeature(area)).toBe(true);
  });

  it('makes areas valid when possible', function() {
    spyOn(os.alertManager, 'sendAlert');

    // box represented by a closed line can be converted to a polygon
    var closedLine = new ol.geom.LineString([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]);
    area.setGeometry(closedLine);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(closedLine);
    expect(os.alertManager.sendAlert.calls.length).toBe(0);

    // two touching boxes, represented as two closed lines, can be converted to a multipolygon
    var twoBoxes = new ol.geom.MultiLineString([
      [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]],
      [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]
    ]);
    area.setGeometry(twoBoxes);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(twoBoxes);
    expect(os.alertManager.sendAlert.calls.length).toBe(0);

    // polygon that crosses itself will be corrected as a multipolygon
    var crosses = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 0], [1, 1], [0, 0]]]);
    area.setGeometry(crosses);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(crosses);
    expect(area.getGeometry() instanceof ol.geom.MultiPolygon).toBe(true);
    expect(os.alertManager.sendAlert.calls.length).toBe(0);

    // multipolygon with overlap can be buffered, but should alert the user
    var overlap = new ol.geom.MultiPolygon([
      [[[0, 0], [0, 1], [1, 0], [1, 1], [0, 0]]],
      [[[0.5, 0.5], [0.5, 1.5], [1.5, 0.5], [1.5, 1.5], [0.5, 0.5]]]
    ]);
    area.setGeometry(overlap);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(overlap);
    expect(os.alertManager.sendAlert.calls.length).toBe(1);
  });
});
