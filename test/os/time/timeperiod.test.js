goog.require('os.time.period');


/**
 * Tests for os.time.period utility functions.
 */
describe('os.time.period', function() {
  it('should format convert time period strings to millis', function() {
    var tests = [
      {
        input: 'P1Y10M4DT13H52M1S',
        output: (365 + (10 * 30) + 4) * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000 + 52 * 60 * 1000 + 1000
      }, {
        input: 'PT12S',
        output: 12 * 1000
      }, {
        input: 'P7D',
        output: 7 * 24 * 60 * 60 * 1000
      }, {
        input: 'PT1H',
        output: 60 * 60 * 1000
      }, {
        input: 'P1DT6H',
        output: 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000
      }
    ];

    for (var i = 0, n = tests.length; i < n; i++) {
      expect(os.time.period.toMillis(tests[i].input)).toBe(tests[i].output);
    }
  });

  it('should format convert millis to time period strings', function() {
    var tests = [
      {
        input: 'PT12S',
        output: 12 * 1000
      }, {
        input: 'P7D',
        output: 7 * 24 * 60 * 60 * 1000
      }, {
        input: 'PT1H',
        output: 60 * 60 * 1000
      }, {
        input: 'P1DT6H',
        output: 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000
      }
    ];

    for (var i = 0, n = tests.length; i < n; i++) {
      expect(os.time.period.toTimePeriod(tests[i].output)).toBe(tests[i].input);
    }
  });
});
