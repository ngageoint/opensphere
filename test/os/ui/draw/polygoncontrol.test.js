goog.require('os.ui.draw.PolygonControl');
goog.require('goog.events.BrowserEvent');


var svg = null;
var poly = null;
var svgPoly = null;

var fakeMouseEvent = function(type, x, y) {
  return new goog.events.BrowserEvent({
    'type': type,
    'clientX': x,
    'clientY': y,
    'layerX': x,
    'layerY': y,
    'offsetX': x,
    'offsetY': y,
    'preventDefault': function() {},
    'stopImmediatePropagation': function() {}
  });
};

var getTransformedCoordinate = function(x, y) {
  var point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  point = point.matrixTransform(svg.getScreenCTM().inverse());

  return new goog.math.Coordinate(point.x, point.y);
};

var getTransformedCoordinateString = function(x, y) {
  var coord = getTransformedCoordinate(x, y);
  return coord.x + ',' + coord.y;
};

describe('os.ui.draw.PolygonControl', function() {
  beforeEach(function() {
    svg = d3.select('body').append('svg').attr('width', 100).attr('height', 100).node();
    poly = new os.ui.draw.PolygonControl(svg);
    svgPoly = d3.select(svg).append('g').attr('class', 'brush')
        .append(poly.getElementType()).attr('class', 'extent').node();
    poly.setMarker(svgPoly);
  });

  afterEach(function() {
    d3.select('svg').remove();
    svgPoly = null;
    poly = null;
    svg = null;
  });

  it('should init properly', function() {
    expect(poly.getElementType()).toBe('polygon');
    expect(poly.owner).toBe(svg);
    expect(d3.select('polygon').size()).toBe(1);
    expect(poly.marker_).toBe(svgPoly);
  });

  it('should initialize a click listener when activated without an event', function() {
    // activate the poly control, starting at (10,20)
    poly.activate();

    // make sure listeners were set up correctly
    expect(goog.events.hasListener(document, 'click', true)).toBe(true);
    expect(goog.events.hasListener(document, 'dblclick', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(false);

    // shouldn't be any coordinates yet
    expect(poly.coords_.length).toBe(0);

    poly.onMouseClick_(fakeMouseEvent('click', 10, 20));

    var testCoord = getTransformedCoordinate(10, 20);
    expect(poly.coords_.length).toBe(1);
    expect(poly.coords_[0].x).toBe(testCoord.x);
    expect(poly.coords_[0].y).toBe(testCoord.y);

    // check listener status after first click
    expect(goog.events.hasListener(document, 'dblclick', true)).toBe(true);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(true);

    poly.deactivate(fakeMouseEvent('dblclick', 30, 50));
    expect(poly.marker_).toBeNull();

    // make sure listeners were cleaned up correctly
    expect(goog.events.hasListener(document, 'click', true)).toBe(false);
    expect(goog.events.hasListener(document, 'dblclick', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(false);
  });

  it('should initialize all listeners when activated with an event', function() {
    // activate the poly control, starting at (10,20)
    poly.activate(fakeMouseEvent('click', 10, 20));

    var testCoord = getTransformedCoordinate(10, 20);
    expect(poly.coords_.length).toBe(1);
    expect(poly.coords_[0].x).toBe(testCoord.x);
    expect(poly.coords_[0].y).toBe(testCoord.y);

    // make sure listeners were set up correctly
    expect(goog.events.hasListener(document, 'click', true)).toBe(true);
    expect(goog.events.hasListener(document, 'dblclick', true)).toBe(true);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(true);

    poly.deactivate(fakeMouseEvent('dblclick', 30, 50));
    expect(poly.marker_).toBeNull();

    // make sure listeners were cleaned up correctly
    expect(goog.events.hasListener(document, 'click', true)).toBe(false);
    expect(goog.events.hasListener(document, 'dblclick', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(false);
  });

  it('should draw a polygon using an svg polygon element and test for containment', function() {
    // activate the poly control, starting at (10,20)
    poly.activate(fakeMouseEvent('click', 10, 20));
    expect(poly.coords_.length).toBe(1);

    var coord1Str = getTransformedCoordinateString(10, 20);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord1Str);

    // 'drag' the poly to (30,50)
    poly.onMouseMove_(fakeMouseEvent('mousemove', 30, 50));
    expect(poly.coords_.length).toBe(2);

    var coord2Str = getTransformedCoordinateString(30, 50);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord2Str + ' ' + coord1Str);

    // 'drag' the poly to (15,55)
    poly.onMouseMove_(fakeMouseEvent('mousemove', 15, 55));
    expect(poly.coords_.length).toBe(2);

    var coord3Str = getTransformedCoordinateString(15, 55);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord3Str + ' ' + coord1Str);

    // 'attach' the poly to (15,55)
    poly.onMouseClick_(fakeMouseEvent('click', 15, 55));
    expect(poly.coords_.length).toBe(2);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord3Str + ' ' + coord1Str);

    // 'drag' the poly to (30,50)
    poly.onMouseMove_(fakeMouseEvent('mousemove', 30, 50));
    expect(poly.coords_.length).toBe(3);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord3Str + ' ' + coord2Str + ' ' + coord1Str);

    // 'attach' the poly to (30,50)
    poly.onMouseClick_(fakeMouseEvent('click', 30, 50));
    expect(poly.coords_.length).toBe(3);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord3Str + ' ' + coord2Str + ' ' + coord1Str);

    // 'drag' the poly to (25,25)
    poly.onMouseMove_(fakeMouseEvent('mousemove', 25, 25));
    expect(poly.coords_.length).toBe(4);

    var coord4Str = getTransformedCoordinateString(25, 25);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord3Str + ' ' + coord2Str + ' ' + coord4Str + ' ' + coord1Str);

    // 'attach' the poly to (25,25)
    poly.onMouseClick_(fakeMouseEvent('click', 25, 25));
    expect(poly.coords_.length).toBe(4);
    expect(svgPoly.getAttribute('points')).toBe(coord1Str + ' ' + coord3Str + ' ' + coord2Str + ' ' + coord4Str + ' ' + coord1Str);

    // test coordinates inside the bounding poly
    expect(poly.contains(getTransformedCoordinate(11, 21))).toBe(true);
    expect(poly.contains(getTransformedCoordinate(16, 54))).toBe(true);
    expect(poly.contains(getTransformedCoordinate(29, 49))).toBe(true);
    expect(poly.contains(getTransformedCoordinate(24, 26))).toBe(true);
    expect(poly.contains(getTransformedCoordinate(20, 40))).toBe(true);

    // test coordinates outside the bounding poly
    expect(poly.contains(getTransformedCoordinate(0, 0))).toBe(false);
    expect(poly.contains(getTransformedCoordinate(20, 0))).toBe(false);
    expect(poly.contains(getTransformedCoordinate(40, 0))).toBe(false);
    expect(poly.contains(getTransformedCoordinate(9, 19))).toBe(false);
    expect(poly.contains(getTransformedCoordinate(14, 56))).toBe(false);
    expect(poly.contains(getTransformedCoordinate(31, 51))).toBe(false);
    expect(poly.contains(getTransformedCoordinate(26, 24))).toBe(false);

    poly.deactivate(fakeMouseEvent('dblclick', 25, 25));
  });
});
