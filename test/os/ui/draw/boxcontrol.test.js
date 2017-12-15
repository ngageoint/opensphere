goog.require('os.ui.draw.BoxControl');
goog.require('goog.events.BrowserEvent');


var svg = null;
var box = null;
var svgBox = null;

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


describe('os.ui.draw.BoxControl', function() {
  beforeEach(function() {
    svg = d3.select('body').append('svg').attr('width', 100).attr('height', 100).node();
    box = new os.ui.draw.BoxControl(svg);
    svgBox = d3.select(svg).append('g').attr('class', 'brush')
        .append(box.getElementType()).attr('class', 'extent').node();
    box.setMarker(svgBox);
  });

  afterEach(function() {
    d3.select('svg').remove();
    svgBox = null;
    box = null;
    svg = null;
  });

  it('should init properly', function() {
    expect(box.getElementType()).toBe('rect');
    expect(box.owner).toBe(svg);
    expect(d3.select('rect').size()).toBe(1);
    expect(box.marker_).toBe(svgBox);
  });

  it('should initialize a mousedown listener when activated without a mousedown event', function() {
    // activate the box control, starting at (10,20)
    box.activate();

    // make sure listeners were set up correctly
    expect(goog.events.hasListener(document, 'mousedown', true)).toBe(true);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mouseup', true)).toBe(false);

    box.onMouseDown_(fakeMouseEvent('mousedown', 10, 20));

    // check listener status after mousedown; mousedown listener will still be there since we faked the event
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(true);
    expect(goog.events.hasListener(document, 'mouseup', true)).toBe(true);

    box.deactivate(fakeMouseEvent('mouseup', 30, 50));
    expect(box.marker_).toBeNull();

    // make sure listeners were cleaned up correctly
    expect(goog.events.hasListener(document, 'mousedown', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mouseup', true)).toBe(false);
  });

  it('should initialize source and mousemove/up listeners when activated with a mousedown event', function() {
    // activate the box control, starting at (10,20)
    box.activate(fakeMouseEvent('mousedown', 10, 20));

    // make sure listeners were set up correctly
    expect(goog.events.hasListener(document, 'mousedown', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(true);
    expect(goog.events.hasListener(document, 'mouseup', true)).toBe(true);

    box.deactivate(fakeMouseEvent('mouseup', 30, 50));
    expect(box.marker_).toBeNull();

    // make sure listeners were cleaned up correctly
    expect(goog.events.hasListener(document, 'mousedown', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mousemove', true)).toBe(false);
    expect(goog.events.hasListener(document, 'mouseup', true)).toBe(false);
  });

  it('should draw a bounding box using an svg rect element and test for containment', function() {
    // activate the box control, starting at (10,20)
    box.activate(fakeMouseEvent('mousedown', 10, 20));

    // test source, taking into account the svg transform matrix
    var svgMatrix = svg.getScreenCTM().inverse();
    expect(box.source_.x).toBe(10 + svgMatrix.e);
    expect(box.source_.y).toBe(20 + svgMatrix.f);

    // 'drag' the box to (30,50)
    box.onMouseMove_(fakeMouseEvent('mousemove', 30, 50));
    expect(Number(svgBox.getAttribute('x'))).toBe(box.source_.x);
    expect(Number(svgBox.getAttribute('y'))).toBe(box.source_.y);
    expect(Number(svgBox.getAttribute('width'))).toBe(20);
    expect(Number(svgBox.getAttribute('height'))).toBe(30);

    // 'drag' the box to (30,0)
    box.onMouseMove_(fakeMouseEvent('mousemove', 30, 0));
    expect(Number(svgBox.getAttribute('x'))).toBe(box.source_.x);
    expect(Number(svgBox.getAttribute('y'))).toBe(0 + svgMatrix.f);
    expect(Number(svgBox.getAttribute('width'))).toBe(20);
    expect(Number(svgBox.getAttribute('height'))).toBe(20);

    // 'drag' the box to (0,0)
    box.onMouseMove_(fakeMouseEvent('mousemove', 0, 0));
    expect(Number(svgBox.getAttribute('x'))).toBe(0 + svgMatrix.e);
    expect(Number(svgBox.getAttribute('y'))).toBe(0 + svgMatrix.f);
    expect(Number(svgBox.getAttribute('width'))).toBe(10);
    expect(Number(svgBox.getAttribute('height'))).toBe(20);

    // 'drag' the box to (0,50)
    box.onMouseMove_(fakeMouseEvent('mousemove', 0, 50));
    expect(Number(svgBox.getAttribute('x'))).toBe(0 + svgMatrix.e);
    expect(Number(svgBox.getAttribute('y'))).toBe(box.source_.y);
    expect(Number(svgBox.getAttribute('width'))).toBe(10);
    expect(Number(svgBox.getAttribute('height'))).toBe(30);

    // 'drag' the box to (30,50)
    box.onMouseMove_(fakeMouseEvent('mousemove', 30, 50));
    expect(Number(svgBox.getAttribute('x'))).toBe(box.source_.x);
    expect(Number(svgBox.getAttribute('y'))).toBe(box.source_.y);
    expect(Number(svgBox.getAttribute('width'))).toBe(20);
    expect(Number(svgBox.getAttribute('height'))).toBe(30);

    // test coordinates inside the bounding box
    expect(box.contains(getTransformedCoordinate(10, 20))).toBe(true);
    expect(box.contains(getTransformedCoordinate(30, 20))).toBe(true);
    expect(box.contains(getTransformedCoordinate(30, 50))).toBe(true);
    expect(box.contains(getTransformedCoordinate(10, 50))).toBe(true);
    expect(box.contains(getTransformedCoordinate(20, 40))).toBe(true);

    // test coordinates outside the bounding box
    expect(box.contains(getTransformedCoordinate(0, 0))).toBe(false);
    expect(box.contains(getTransformedCoordinate(20, 0))).toBe(false);
    expect(box.contains(getTransformedCoordinate(40, 0))).toBe(false);
    expect(box.contains(getTransformedCoordinate(9, 19))).toBe(false);
    expect(box.contains(getTransformedCoordinate(31, 19))).toBe(false);
    expect(box.contains(getTransformedCoordinate(31, 51))).toBe(false);
    expect(box.contains(getTransformedCoordinate(9, 51))).toBe(false);

    box.deactivate(fakeMouseEvent('mouseup', 30, 50));
  });
});
