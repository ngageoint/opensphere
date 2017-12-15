goog.provide('os.ogc.filter.OGCFilterOverride');
goog.require('ol.proj.EPSG4326');
goog.require('os.net.AbstractModifier');
goog.require('os.net.IModifier');
goog.require('os.ogc.filter.OGCFilterModifier');
goog.require('os.time');



/**
 * Replaces OGC filter to load data matching specific property values.
 * @param {(Object<string, !Array<string>>|string)} filter Filter string, or a map of data fields/values to match
 * @param {string=} opt_startColumn The start date column
 * @param {string=} opt_endColumn The end date column
 * @param {os.time.TimeRange=} opt_timeRange The time range to load
 * @param {ol.Extent=} opt_bbox The query bounding box
 * @implements {os.net.IModifier}
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.ogc.filter.OGCFilterOverride = function(filter, opt_startColumn, opt_endColumn, opt_timeRange, opt_bbox) {
  os.ogc.filter.OGCFilterOverride.base(this, 'constructor', os.ogc.filter.OGCFilterOverride.ID, -200);

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
   * @type {os.time.TimeRange|undefined}
   * @private
   */
  this.timeRange_ = opt_timeRange;
};
goog.inherits(os.ogc.filter.OGCFilterOverride, os.net.AbstractModifier);


/**
 * The modifier ID
 * @type {string}
 * @const
 */
os.ogc.filter.OGCFilterOverride.ID = 'OGCFilterOverride';


/**
 * @inheritDoc
 */
os.ogc.filter.OGCFilterOverride.prototype.modify = function(uri) {
  var param = 'filter';
  var qd = uri.getQueryData();
  var old = qd.get(param);

  if (old) {
    qd.set(param, this.createFilter_());
  }
};


/**
 * @return {string} The WFS filter string
 * @private
 */
os.ogc.filter.OGCFilterOverride.prototype.createFilter_ = function() {
  var filter = os.ogc.filter.OGCFilterModifier.FILTER_BEGIN + '<And>';

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
    var start = os.time.format(new Date(this.timeRange_.getStart()), undefined, false, true);
    var end = os.time.format(new Date(this.timeRange_.getEnd()), undefined, false, true);
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

  filter += '</And>' + os.ogc.filter.OGCFilterModifier.FILTER_END;
  return filter;
};
