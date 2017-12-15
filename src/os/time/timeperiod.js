goog.provide('os.time.period');
goog.require('goog.string');


/**
 * Takes an ISO-8601 period and converts it to milliseconds.
 * @param {string} period The period to convert
 * @return {number} The number of milliseconds represented by the period
 */
os.time.period.toMillis = function(period) {
  var m = 0;
  if (period) {
    var n = period.length;
    var s = '';
    var i = 1;
    var j = 1;
    var x = 0;
    var t = false;

    while (i < n && j < n) {
      s = period.charAt(j).toUpperCase();

      if (goog.string.isNumeric(s)) {
        j++;
      } else if (s == 'T') {
        t = true;
        j++;
        i = j;
      } else {
        x = parseInt(period.substring(i, j), 10);

        if (!isNaN(x)) {
          switch (s) {
            case 'Y':
              m += x * 365 * 24 * 60 * 60 * 1000;
              break;
            case 'M':
              m += t ? x * 60 * 1000 : x * 30 * 24 * 60 * 60 * 1000;
              break;
            case 'D':
              m += x * 24 * 60 * 60 * 1000;
              break;
            case 'H':
              m += x * 60 * 60 * 1000;
              break;
            case 'S':
              m += x * 1000;
              break;
            default:
              break;
          }
        }

        j++;
        i = j;
      }
    }
  }

  return m;
};


/**
 * Takes milliseconds and converts it to an ISO-8601 time period string.
 * @param {number} ms The range in milliseconds
 * @return {string} An ISO-8601 formatted period string
 */
os.time.period.toTimePeriod = function(ms) {
  var s = 'P';

  var x = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (x > 0) {
    s += x + 'D';
    ms -= x * 24 * 60 * 60 * 1000;
  }

  var t = false;
  var vals = [{
    c: 'H',
    x: 60 * 60 * 1000
  }, {
    c: 'M',
    x: 60 * 1000
  }, {
    c: 'S',
    x: 1000
  }];

  for (var i = 0, n = vals.length; i < n; i++) {
    x = Math.floor(ms / vals[i].x);

    if (x > 0) {
      if (!t) {
        s += 'T';
        t = true;
      }
      s += x + vals[i].c;
      ms -= x * vals[i].x;
    }
  }

  return s;
};
