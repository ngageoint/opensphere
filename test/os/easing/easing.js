goog.require('os.easing');


describe('os.easing', function() {
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
    expect(os.easing.easeLinear(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(os.easing.easeLinear(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(os.easing.easeLinear(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeLinear(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(os.easing.easeLinear(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(os.easing.easeLinear(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(os.easing.easeLinear(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(os.easing.easeLinear(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeLinear(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeLinear(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test exponential easing', function() {
    expect(proximityTest(os.easing.easeExpo(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeExpo(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(os.easing.easeExpo(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(proximityTest(os.easing.easeExpo(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeExpo(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeExpo(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test cubic easing', function() {
    expect(os.easing.easeCubic(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(os.easing.easeCubic(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(os.easing.easeCubic(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeCubic(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(os.easing.easeCubic(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(os.easing.easeCubic(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(os.easing.easeCubic(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(os.easing.easeCubic(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeCubic(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeCubic(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test quartic easing', function() {
    expect(os.easing.easeQuartic(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(os.easing.easeQuartic(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(os.easing.easeQuartic(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeQuartic(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(os.easing.easeQuartic(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(os.easing.easeQuartic(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(os.easing.easeQuartic(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(os.easing.easeQuartic(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeQuartic(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeQuartic(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test quintic easing', function() {
    expect(os.easing.easeQuintic(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(os.easing.easeQuintic(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(os.easing.easeQuintic(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeQuintic(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(os.easing.easeQuintic(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(os.easing.easeQuintic(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(os.easing.easeQuintic(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(os.easing.easeQuintic(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeQuintic(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeQuintic(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test circular in easing', function() {
    expect(os.easing.easeCircular(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(os.easing.easeCircular(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(os.easing.easeCircular(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeCircular(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(midpointTest(os.easing.easeCircular(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(false);

    expect(os.easing.easeCircular(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(os.easing.easeCircular(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(os.easing.easeCircular(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeCircular(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeCircular(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });

  it('should test sinusoidal easing', function() {
    expect(os.easing.easeSinusoidal(0, min1, max1 - min1, steps1)).toBe(min1);
    expect(os.easing.easeSinusoidal(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(os.easing.easeSinusoidal(steps1, min1, max1 - min1, steps1)).toBe(max1);
    expect(proximityTest(os.easing.easeSinusoidal(steps1 * .49, min1, max1 - min1, steps1), min1, max1)).toBe(min1);
    expect(proximityTest(os.easing.easeSinusoidal(steps1 * .51, min1, max1 - min1, steps1), min1, max1)).toBe(max1);
    expect(midpointTest(os.easing.easeSinusoidal(steps1 * .5, min1, max1 - min1, steps1), min1, max1)).toBe(true);

    expect(os.easing.easeSinusoidal(0, min2, max2 - min2, steps2)).toBe(min2);
    expect(os.easing.easeSinusoidal(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(os.easing.easeSinusoidal(steps2, min2, max2 - min2, steps2)).toBe(max2);
    expect(proximityTest(os.easing.easeSinusoidal(steps2 * .49, min2, max2 - min2, steps2), min2, max2)).toBe(min2);
    expect(proximityTest(os.easing.easeSinusoidal(steps2 * .51, min2, max2 - min2, steps2), min2, max2)).toBe(max2);
    expect(midpointTest(os.easing.easeSinusoidal(steps2 * .5, min2, max2 - min2, steps2), min2, max2)).toBe(true);
  });
});
