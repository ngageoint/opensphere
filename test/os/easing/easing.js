goog.require('os.easing');


describe('os.easing', function() {
  const osEasing = goog.module.get('os.easing');

  // test set 1
  var min1 = 0;
  var max1 = 1;
  var steps1 = 1;

  // test set 2
  var min2 = -100;
  var max2 = 100;
  var steps2 = 1000;

  /**
   * test that a value is closer to a or b
   * @param {number} val
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  var proximityTest = function(val, a, b) {
    return (a - val) < (b - val) ? a : b;
  };

  /**
   * test that a value is the midpoint between a and b
   * @param {number} val
   * @param {number} a
   * @param {number} b
   * @return {boolean}
   */
  var midpointTest = function(val, a, b) {
    return val == (a + b) / 2;
  };

  it('should test linear easing', function() {
    expect(osEasing.easeLinear(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(osEasing.easeLinear(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(osEasing.easeLinear(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeLinear(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(osEasing.easeLinear(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(osEasing.easeLinear(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(osEasing.easeLinear(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(osEasing.easeLinear(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeLinear(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeLinear(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test exponential easing', function() {
    expect(proximityTest(osEasing.easeExpo(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeExpo(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(osEasing.easeExpo(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(proximityTest(osEasing.easeExpo(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeExpo(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeExpo(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test cubic easing', function() {
    expect(osEasing.easeCubic(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(osEasing.easeCubic(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(osEasing.easeCubic(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeCubic(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(osEasing.easeCubic(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(osEasing.easeCubic(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(osEasing.easeCubic(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(osEasing.easeCubic(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeCubic(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeCubic(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test quartic easing', function() {
    expect(osEasing.easeQuartic(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(osEasing.easeQuartic(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(osEasing.easeQuartic(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeQuartic(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(osEasing.easeQuartic(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(osEasing.easeQuartic(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(osEasing.easeQuartic(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(osEasing.easeQuartic(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeQuartic(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeQuartic(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test quintic easing', function() {
    expect(osEasing.easeQuintic(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(osEasing.easeQuintic(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(osEasing.easeQuintic(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeQuintic(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(osEasing.easeQuintic(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(osEasing.easeQuintic(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(osEasing.easeQuintic(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(osEasing.easeQuintic(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeQuintic(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeQuintic(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test circular in easing', function() {
    expect(osEasing.easeCircular(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(osEasing.easeCircular(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(osEasing.easeCircular(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeCircular(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(midpointTest(osEasing.easeCircular(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(false);

    expect(osEasing.easeCircular(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(osEasing.easeCircular(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(osEasing.easeCircular(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeCircular(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeCircular(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test sinusoidal easing', function() {
    expect(osEasing.easeSinusoidal(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(osEasing.easeSinusoidal(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(osEasing.easeSinusoidal(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(osEasing.easeSinusoidal(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(osEasing.easeSinusoidal(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(osEasing.easeSinusoidal(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(osEasing.easeSinusoidal(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(osEasing.easeSinusoidal(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(osEasing.easeSinusoidal(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(osEasing.easeSinusoidal(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(osEasing.easeSinusoidal(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(osEasing.easeSinusoidal(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });
});
