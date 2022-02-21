goog.declareModuleId('plugin.ogc.query.OGCTemporalFormatter');

import * as time from '../../../os/time/time.js';

/**
 * @implements {ITemporalFormatter}
 */
export default class OGCTemporalFormatter {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {string}
     * @private
     */
    this.startColumn_ = OGCTemporalFormatter.DEFAULT_COLUMN_;

    /**
     * @type {string}
     * @private
     */
    this.endColumn_ = OGCTemporalFormatter.DEFAULT_COLUMN_;

    /**
     * @type {boolean}
     * @private
     */
    this.roundTimeEnabled_ = false;
  }

  /**
   * Set the start column.
   *
   * @param {?string} value
   */
  setStartColumn(value) {
    this.startColumn_ = value || OGCTemporalFormatter.DEFAULT_COLUMN_;
  }

  /**
   * Set the end column.
   *
   * @param {?string} value
   */
  setEndColumn(value) {
    this.endColumn_ = value || OGCTemporalFormatter.DEFAULT_COLUMN_;
  }

  /**
   * Turn on time rounding
   */
  setRoundTimeEnabled() {
    this.roundTimeEnabled_ = true;
  }

  /**
   * @inheritDoc
   */
  format(controller) {
    var ranges = controller.getEffectiveLoadRanges();
    if (ranges.length < 1) { // possible to load a range that doesn't get sliced
      if (!controller.hasSliceRanges()) {
        ranges = [controller.getRange()];
      } else {
        var d = new Date().getTime() + time.millisecondsInDay; // set in future so no data is queried
        ranges = [controller.buildRange(d, d + 1000)];
      }
    }
    var filters = '<Or>';

    for (var i = 0; i < ranges.length; i++) {
      var filter = '<And>';
      filter += OGCTemporalFormatter.FILTER;
      var range = ranges[i];
      var start = time.format(new Date(range.start), undefined, false, true);
      var end = time.format(new Date(range.end), undefined, false, true);

      // THIN-7523 - hack to avoid requests that go below a second
      if (this.roundTimeEnabled_) {
        var startInt = Math.floor(range.start / 1000) * 1000;
        start = time.format(new Date(startInt), undefined, false, true);
        var endInt = Math.ceil(range.end / 1000) * 1000;
        endInt = endInt <= startInt ? startInt + 1000 : endInt;
        end = time.format(new Date(endInt), undefined, false, true);
      }

      filter = filter.replace(/{startColumn}/g, this.startColumn_);
      filter = filter.replace(/{endColumn}/g, this.endColumn_);
      filter = filter.replace(/{start}/g, start);
      filter = filter.replace(/{end}/g, end);
      filter += '</And>';
      filters += filter;
    }
    filters += '</Or>';

    return filters;
  }
}


/**
 * @type {string}
 * @const
 * @private
 */
OGCTemporalFormatter.DEFAULT_COLUMN_ = 'validTime';


/**
 * The correct check for intersection of both time instants and ranges with a range is:
 *    END_COLUMN >= START_TIME && START_COLUMN < END_TIME
 *
 * You might be to be tempted to read this and change it to:
 *    START_COLUMN >= START_TIME && END_COLUMN < END_TIME
 *
 * THIS IS WRONG!
 *
 * It's wrong because it only works for time instants and ranges which are fully
 * contained within the time range. The query should also properly pull records which
 * are active over one edge of the range or records which have a time range which
 * fully contains the query range.
 *
 * @type {string}
 * @const
 */
OGCTemporalFormatter.FILTER = '<PropertyIsGreaterThanOrEqualTo>' +
    '<PropertyName>{endColumn}</PropertyName>' +
    '<Literal>{start}</Literal>' +
    '</PropertyIsGreaterThanOrEqualTo>' +
    '<PropertyIsLessThan>' +
    '<PropertyName>{startColumn}</PropertyName>' +
    '<Literal>{end}</Literal>' +
    '</PropertyIsLessThan>';
