goog.provide('os.histo.FilterComponent');


/**
 * Strings used to create OGC filters from a histogram.
 *
 * These were primarily put here so tests won't immediately break if we need to tweak a filter.
 * @enum {string}
 */
os.histo.FilterComponent = {
  IS_EMPTY_HEAD: '<PropertyIsNull><PropertyName>',
  IS_EMPTY_TAIL: '</PropertyName></PropertyIsNull>',

  IS_EQUAL_HEAD: '<PropertyIsEqualTo><PropertyName>',
  IS_EQUAL_MID: '</PropertyName><Literal><![CDATA[',
  IS_EQUAL_TAIL: ']]></Literal></PropertyIsEqualTo>',

  GT_HEAD: '<PropertyIsGreaterThanOrEqualTo><PropertyName>',
  GT_MID: '</PropertyName><Literal><![CDATA[',
  GT_TAIL: ']]></Literal></PropertyIsGreaterThanOrEqualTo>',

  LT_HEAD: '<PropertyIsLessThan><PropertyName>',
  LT_MID: '</PropertyName><Literal><![CDATA[',
  LT_TAIL: ']]></Literal></PropertyIsLessThan>'
};
