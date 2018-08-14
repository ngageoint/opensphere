goog.require('os.math.Circle');


describe('os.math.Circle', function() {
  it('should create with defaults', function() {
    var circle = new os.math.Circle();
    expect(circle.x).toBe(0);
    expect(circle.y).toBe(0);
    expect(circle.radius).toBe(0);
  });

  it('should create with specific values', function() {
    var circle = new os.math.Circle(2, 3, 4);
    expect(circle.x).toBe(2);
    expect(circle.y).toBe(3);
    expect(circle.radius).toBe(4);
  });

  it('should clone properly', function() {
    var c1 = new os.math.Circle(2, 3, 4);
    var c2 = c1.clone();
    expect(c2.x).toBe(c1.x);
    expect(c2.y).toBe(c1.y);
    expect(c2.radius).toBe(c1.radius);
  });

  it('should check for equals properly', function() {
    var c1 = new os.math.Circle(2, 3, 4);
    var c2 = c1.clone();
    expect(os.math.Circle.equals(c1, c2)).toBe(true);
    expect(os.math.Circle.equals(c1, null)).toBe(false);
    expect(os.math.Circle.equals(null, c2)).toBe(false);
    expect(os.math.Circle.equals(null, null)).toBe(true);

    c2.x += 1;
    expect(os.math.Circle.equals(c1, c2)).toBe(false);
    c2 = c1.clone();
    c2.y += 1;
    expect(os.math.Circle.equals(c1, c2)).toBe(false);
    c2 = c1.clone();
    c2.radius += 1;
    expect(os.math.Circle.equals(c1, c2)).toBe(false);
  });

  it('should properly compute the closest point on the circle', function() {
    var c1 = new os.math.Circle(2, 3, 4);

    // ensure that we have checks for sending the exact center
    var p = c1.getClosestCirclePoint(2, 3);
    // check that it didn't blow up
    expect(isNaN(p.x)).toBe(false);
    expect(isNaN(p.y)).toBe(false);
    // check that the result is on the circle
    expect(Math.pow((p.x - 2), 2) + Math.pow((p.y - 3), 2)).toBe(4);

    // on the circle
    p = c1.getClosestCirclePoint(6, 3);
    expect(p.x).toBe(6);
    expect(p.y).toBe(3);

    // inside the circle
    p = c1.getClosestCirclePoint(5, 3);
    expect(p.x).toBe(6);
    expect(p.y).toBe(3);

    // outside the circle
    p = c1.getClosestCirclePoint(7, 3);
    expect(p.x).toBe(6);
    expect(p.y).toBe(3);
  });
});
