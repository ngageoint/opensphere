goog.declareModuleId('os.math.Circle');

const Coordinate = goog.require('goog.math.Coordinate');
const math = goog.requireType('goog.math');


/**
 * Class for representing circles
 */
export default class Circle extends Coordinate {
  /**
   * Constructor.
   * @param {number=} opt_x Circle center x, defaults to 0
   * @param {number=} opt_y Circle center y, defaults to 0
   * @param {number=} opt_radius Circle radius, defaults to 0
   */
  constructor(opt_x, opt_y, opt_radius) {
    super(opt_x, opt_y);
    this.radius = opt_radius !== undefined ? opt_radius : 0;
  }

  /**
   * Returns a new copy of the circle
   *
   * @override
   * @return {!os.math.Circle} A clone of this circle
   */
  clone() {
    return new Circle(this.x, this.y, this.radius);
  }

  /**
   * Returns a nice string representing the circle
   *
   * @return {string} in the form C (50, 73) R 30
   * @override
   */
  toString() {
    return 'C (' + this.x + ', ' + this.y + ') R ' + this.radius;
  }

  /**
   * Scales this circle by the given scale factors. The x and y values are
   * scaled by {@code sx} and {@code opt_sy} respectively. If {@code opt_sy}
   * is not given then {@code sx} is used for both x and y. The radius is scaled
   * by {@code sx}.
   *
   * @param {number} sx The scale factor to use for the x dimension.
   * @param {number=} opt_sy The scale factor to use for the y dimension.
   * @return {!Coordinate} This coordinate after scaling.
   * @override
   */
  scale(sx, opt_sy) {
    var sy = typeof opt_sy === 'number' ? opt_sy : sx;
    this.x *= sx;
    this.y *= sy;
    this.radius *= sx;
    return this;
  }

  /**
   * Gets the closest point on the circle to the given point
   *
   * @param {number|Coordinate} x
   * @param {number=} opt_y The y coordinate of the point - required if x is a number,
   *  ignored if x is a math.Coordinate
   * @return {!goog.math.Coordinate} The point on the circle.
   */
  getClosestCirclePoint(x, opt_y) {
    var y;

    if (x instanceof Coordinate) {
      y = x.y;
      x = x.x;
    } else {
      y = opt_y;
    }

    // check for center equal to point
    if (x == this.x && y == this.y) {
      // any point on the circle is acceptable
      return new Coordinate(this.radius, this.y);
    }

    var vx = x - this.x;
    var vy = y - this.y;
    var magV = Math.sqrt(vx * vx + vy * vy);

    return new Coordinate(
        this.x + this.radius * vx / magV,
        this.y + this.radius * vy / magV);
  }

  /**
   * Compares circles for equality
   *
   * @param {os.math.Circle} a A circle
   * @param {os.math.Circle} b A circle
   * @return {boolean} True iff the coordinates are equal or if both are null.
   */
  static equals(a, b) {
    if (a == b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    return a.x == b.x && a.y == b.y && a.radius == b.radius;
  }
}
