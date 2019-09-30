goog.require('os.time.period');


/**
 * Tests for os.time.period utility functions.
 */
describe('os.time.period', function() {
  // the calculation that moment uses to convert months to days
  var monthsToDays = function(months) {
    return Math.round(months * (146097 / 4800));
  };

  it('should format convert time period strings to millis', function() {
    var tests = [
      {
        input: 'P1Y10M4DT13H52M1S',
        output: (monthsToDays(12 + 10) + 4) * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000 + 52 * 60 * 1000 + 1000
      }, {
        input: 'P1Y11M8D',
        output: (monthsToDays(12 + 11) + 8) * 24 * 60 * 60 * 1000
      }, {
        input: 'P3Y',
        output: monthsToDays(12 * 3) * 24 * 60 * 60 * 1000
      }, {
        input: 'P2Y3M',
        output: monthsToDays(12 * 2 + 3) * 24 * 60 * 60 * 1000
      }, {
        input: 'P5M',
        output: monthsToDays(5) * 24 * 60 * 60 * 1000
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
      }, {
        input: 'PT0S',
        output: 0
      }, {
        input: 'P',
        output: 0
      }, {
        input: 'P0Y',
        output: 0
      }, {
        input: 'PT0H0M0S',
        output: 0
      }
    ];

    for (var i = 0, n = tests.length; i < n; i++) {
      expect(os.time.period.toMillis(tests[i].input)).toBe(tests[i].output);
    }
  });

  it('should format convert millis to time period strings', function() {
    // these will always bubble up to hours and no further because of moment
    var tests = [
      {
        input: 'PT12S',
        output: 12 * 1000
      }, {
        input: 'PT168H',
        output: 7 * 24 * 60 * 60 * 1000
      }, {
        input: 'PT1H',
        output: 60 * 60 * 1000
      }, {
        input: 'PT30H',
        output: 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000
      }, {
        input: 'P0D',
        output: 0
      }
    ];

    for (var i = 0, n = tests.length; i < n; i++) {
      expect(os.time.period.toTimePeriod(tests[i].output)).toBe(tests[i].input);
    }
  });
});
