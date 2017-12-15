goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('ol.format.KML');
goog.require('ol.xml');
goog.require('plugin.file.kml');


describe('plugin.file.kml', function() {
  it('reads a kml:TimeStamp element', function() {
    var when = new Date();
    var timeStampXml = '<TimeStamp><when>' + when.toISOString() + '</when></TimeStamp>';
    var doc = goog.dom.xml.loadXml(timeStampXml);
    var tsEl = goog.dom.getFirstElementChild(doc);

    var time = plugin.file.kml.readTime(tsEl, []);
    expect(time).not.toBeNull();
    expect(time instanceof os.time.TimeInstant).toBe(true);
    expect(time instanceof os.time.TimeRange).toBe(false);
    expect(time.getStart()).toBe(when.getTime());
    expect(time.getEnd()).toBe(when.getTime());
  });

  it('reads a kml:TimeSpan element', function() {
    var begin = new Date();
    var end = new Date(begin.getTime() + 24 * 60 * 60 * 1000);
    var timeSpanXml = '<TimeSpan><begin>' + begin.toISOString() + '</begin><end>' + end.toISOString() +
        '</end></TimeSpan>';
    var doc = goog.dom.xml.loadXml(timeSpanXml);
    var tsEl = goog.dom.getFirstElementChild(doc);

    var time = plugin.file.kml.readTime(tsEl, []);
    expect(time).not.toBeNull();
    expect(time instanceof os.time.TimeRange).toBe(true);
    expect(time.getStart()).toBe(begin.getTime());
    expect(time.getEnd()).toBe(end.getTime());
  });

  it('reads a kml:Link element better than OL3', function() {
    var href = 'http://urmom.goes/tocollege';
    var refreshMode = 'onInterval';
    var refreshInterval = 10;
    var viewRefreshMode = 'onStop';
    var viewRefreshTime = 15;

    var linkXml =
        '<Link>' +
        '<href>' + href + '</href>' +
        '<refreshMode>' + refreshMode + '</refreshMode>' +
        '<refreshInterval>' + refreshInterval + '</refreshInterval>' +
        '<viewRefreshMode>' + viewRefreshMode + '</viewRefreshMode>' +
        '<viewRefreshTime>' + viewRefreshTime + '</viewRefreshTime>' +
        '</Link>';
    var doc = goog.dom.xml.loadXml(linkXml);
    var linkEl = goog.dom.getFirstElementChild(doc);

    // all but href are our extension to the OL3 parser
    var link = ol.xml.pushParseAndPop({}, plugin.file.kml.OL_LINK_PARSERS(), linkEl, []);
    expect(link['href']).toBe(href);
    expect(link['refreshMode']).toBe(refreshMode);
    expect(link['refreshInterval']).toBe(refreshInterval);
    expect(link['viewRefreshMode']).toBe(viewRefreshMode);
    expect(link['viewRefreshTime']).toBe(viewRefreshTime);
  });
});
