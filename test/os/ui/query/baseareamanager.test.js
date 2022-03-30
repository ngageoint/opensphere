goog.require('os.alert.AlertManager');
goog.require('os.query.AreaManager');
goog.require('os.query.BaseAreaManager');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('os.query.BaseAreaManager', function() {
  const {default: AlertManager} = goog.module.get('os.alert.AlertManager');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');

  let am;
  let area;

  beforeEach(function() {
    am = AreaManager.getInstance();
    area = new Feature();
  });

  it('tests if areas are valid', function() {
    // no geometry
    expect(am.isValidFeature(area)).toBe(false);

    // points aren't valid
    const point = new Point([0, 0]);
    area.setGeometry(point);
    expect(am.isValidFeature(area)).toBe(false);

    // open lines aren't valid
    const line = new LineString([[0, 0], [1, 1]]);
    area.setGeometry(line);
    expect(am.isValidFeature(area)).toBe(false);

    // non-crossing polygon is valid
    const box = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    area.setGeometry(box);
    expect(am.isValidFeature(area)).toBe(true);

    // non-crossing/overlapping polygon is valid
    const twoBoxes = new MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
      [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
    ]);
    area.setGeometry(twoBoxes);
    expect(am.isValidFeature(area)).toBe(true);
  });

  it('makes areas valid when possible', function() {
    spyOn(AlertManager.getInstance(), 'sendAlert');

    // box represented by a closed line can be converted to a polygon
    const closedLine = new LineString([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]);
    area.setGeometry(closedLine);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(closedLine);
    expect(AlertManager.getInstance().sendAlert.calls.length).toBe(0);

    // two touching boxes, represented as two closed lines, can be converted to a multipolygon
    var twoBoxes = new MultiLineString([
      [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]],
      [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]
    ]);
    area.setGeometry(twoBoxes);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(twoBoxes);
    expect(AlertManager.getInstance().sendAlert.calls.length).toBe(0);

    // polygon that crosses itself will be corrected as a multipolygon
    var crosses = new Polygon([[[0, 0], [0, 1], [1, 0], [1, 1], [0, 0]]]);
    area.setGeometry(crosses);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(crosses);
    expect(area.getGeometry() instanceof Polygon).toBe(false);
    expect(AlertManager.getInstance().sendAlert.calls.length).toBe(0);

    // multipolygon with overlap can be buffered, but should alert the user
    var overlap = new MultiPolygon([
      [[[0, 0], [0, 1], [1, 0], [1, 1], [0, 0]]],
      [[[0.5, 0.5], [0.5, 1.5], [1.5, 0.5], [1.5, 1.5], [0.5, 0.5]]]
    ]);
    area.setGeometry(overlap);
    expect(am.isValidFeature(area)).toBe(true);
    expect(area.getGeometry()).not.toBe(overlap);
    expect(AlertManager.getInstance().sendAlert.calls.length).toBe(1);
  });
});
