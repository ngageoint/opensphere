goog.declareModuleId('os.ogc.filter.OGCFilterOverride');

import AbstractModifier from '../../net/abstractmodifier.js';
import {format} from '../../time/time.js';
import OGCFilterModifier from './ogcfiltermodifier.js';

const {default: IModifier} = goog.requireType('os.net.IModifier');
const {default: TimeRange} = goog.requireType('os.time.TimeRange');


/**
 * Replaces OGC filter to load data matching specific property values.
 *
 * @implements {IModifier}
 */
export default class OGCFilterOverride extends AbstractModifier {
  /**
   * Constructor.
   * @param {(Object<string, !Array<string>>|string)} filter Filter string, or a map of data fields/values to match
   * @param {string=} opt_startColumn The start date column
   * @param {string=} opt_endColumn The end date column
   * @param {TimeRange=} opt_timeRange The time range to load
   * @param {ol.Extent=} opt_bbox The query bounding box
   */
  constructor(filter, opt_startColumn, opt_endColumn, opt_timeRange, opt_bbox) {
    super(OGCFilterOverride.ID, -200);

    /**
     * @type {string|undefined}
     * @private
     */
    this.filter_ = undefined;

    if (typeof filter === 'object') {
      var filterStr = '<Or>';

      // add all key/value pairs from the map
      for (var key in filter) {
        var values = filter[key];
        for (var i = 0, n = values.length; i < n; i++) {
          filterStr += '<PropertyIsEqualTo>' +
              '<PropertyName>' + key + '</PropertyName>' +
              '<Literal><![CDATA[' + values[i] + ']]></Literal>' +
              '</PropertyIsEqualTo>';
        }
      }

      filterStr += '</Or>';

      this.filter_ = filterStr;
    } else if (typeof filter == 'string') {
      this.filter_ = filter;
    }

    /**
     * @type {ol.Extent|undefined}
     * @private
     */
    this.bbox_ = opt_bbox;

    /**
     * @type {string|undefined}
     * @private
     */
    this.startColumn_ = opt_startColumn;

    /**
     * @type {string|undefined}
     * @private
     */
    this.endColumn_ = opt_endColumn;

    /**
     * @type {TimeRange|undefined}
     * @private
     */
    this.timeRange_ = opt_timeRange;
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
    var param = 'filter';
    var qd = uri.getQueryData();
    var old = qd.get(param);

    if (old) {
      qd.set(param, this.createFilter_());
    }
  }

  /**
   * @return {string} The WFS filter string
   * @private
   */
  createFilter_() {
    var filter = OGCFilterModifier.FILTER_BEGIN + '<And>';

    if (this.bbox_) {
      filter += '<BBOX>' +
          '<PropertyName>GEOM</PropertyName>' +
          '<gml:Envelope srsName="CRS:84">' +
          '<gml:lowerCorner>' + this.bbox_[0] + ' ' + this.bbox_[1] + '</gml:lowerCorner>' +
          '<gml:upperCorner>' + this.bbox_[2] + ' ' + this.bbox_[3] + '</gml:upperCorner>' +
          '</gml:Envelope>' +
          '</BBOX>';
    }

    if (this.timeRange_ && this.startColumn_ && this.endColumn_) {
      var start = format(new Date(this.timeRange_.getStart()), undefined, false, true);
      var end = format(new Date(this.timeRange_.getEnd()), undefined, false, true);
      filter += '<PropertyIsGreaterThanOrEqualTo>' +
          '<PropertyName>' + this.endColumn_ + '</PropertyName>' +
          '<Literal>' + start + '</Literal>' +
          '</PropertyIsGreaterThanOrEqualTo>' +
          '<PropertyIsLessThan>' +
          '<PropertyName>' + this.startColumn_ + '</PropertyName>' +
          '<Literal>' + end + '</Literal>' +
          '</PropertyIsLessThan>';
    }

    if (this.filter_) {
      filter += this.filter_;
    }

    filter += '</And>' + OGCFilterModifier.FILTER_END;
    return filter;
  }
}

/**
 * The modifier ID
 * @type {string}
 * @const
 */
OGCFilterOverride.ID = 'OGCFilterOverride';
