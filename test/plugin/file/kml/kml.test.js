goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('ol.format.KML');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.xml');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('plugin.file.kml');


describe('plugin.file.kml', function() {
  const dom = goog.module.get('goog.dom');
  const googDomXml = goog.module.get('goog.dom.xml');
  const KML = goog.module.get('ol.format.KML');
  const GeometryLayout = goog.module.get('ol.geom.GeometryLayout');
  const LineString = goog.module.get('ol.geom.LineString');
  const MultiLineString = goog.module.get('ol.geom.MultiLineString');
  const xml = goog.module.get('ol.xml');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');
  const kml = goog.module.get('plugin.file.kml');
  it('reads a kml:TimeStamp element', function() {
    var when = new Date();
    var timeStampXml = '<TimeStamp><when>' + when.toISOString() + '</when></TimeStamp>';
    var doc = googDomXml.loadXml(timeStampXml);
    var tsEl = dom.getFirstElementChild(doc);

    var time = kml.readTime(tsEl, []);
    expect(time).not.toBeNull();
    expect(time instanceof TimeInstant).toBe(true);
    expect(time instanceof TimeRange).toBe(false);
    expect(time.getStart()).toBe(when.getTime());
    expect(time.getEnd()).toBe(when.getTime());
  });

  it('reads a kml:TimeSpan element', function() {
    var begin = new Date();
    var end = new Date(begin.getTime() + 24 * 60 * 60 * 1000);
    var timeSpanXml = '<TimeSpan><begin>' + begin.toISOString() + '</begin><end>' + end.toISOString() +
        '</end></TimeSpan>';
    var doc = googDomXml.loadXml(timeSpanXml);
    var tsEl = dom.getFirstElementChild(doc);

    var time = kml.readTime(tsEl, []);
    expect(time).not.toBeNull();
    expect(time instanceof TimeRange).toBe(true);
    expect(time.getStart()).toBe(begin.getTime());
    expect(time.getEnd()).toBe(end.getTime());
  });

  it('reads a kml:Link element better than Openlayers', function() {
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
    var doc = googDomXml.loadXml(linkXml);
    var linkEl = dom.getFirstElementChild(doc);

    // all but href are our extension to the Openlayers parser
    var link = xml.pushParseAndPop({}, kml.OL_LINK_PARSERS(), linkEl, []);
    expect(link['href']).toBe(href);
    expect(link['refreshMode']).toBe(refreshMode);
    expect(link['refreshInterval']).toBe(refreshInterval);
    expect(link['viewRefreshMode']).toBe(viewRefreshMode);
    expect(link['viewRefreshTime']).toBe(viewRefreshTime);
  });

  it('reads a relative-URI kml:Link element with incorrect (but still supported) backslashes', function() {
    // this covers a case of reading relative-URI assets from a KMZ file with backslash-delimited paths
    var href = 'images\\relative\\url\\image.png';
    var forwardSlashHref = 'images/relative/url/image.png';
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
    var doc = googDomXml.loadXml(linkXml);
    var linkEl = dom.getFirstElementChild(doc);

    linkEl.assetMap = {
      [forwardSlashHref]: 'data://fakeimagedatauri'
    };

    var link = xml.pushParseAndPop({}, kml.OL_LINK_PARSERS(), linkEl, []);
    expect(link['href']).toBe(forwardSlashHref);
    expect(link['refreshMode']).toBe(refreshMode);
    expect(link['refreshInterval']).toBe(refreshInterval);
    expect(link['viewRefreshMode']).toBe(viewRefreshMode);
    expect(link['viewRefreshTime']).toBe(viewRefreshTime);
  });

  describe('Track and MultiTrack Support', function() {
    /**
     * Generate coord/when XML pairs to define a Track.
     * @param {number} count The number of pairs.
     * @param {string} coordNS The namespace for `coord` nodes.
     * @param {number} startTime The start time for `when` nodes.
     * @return {string} The XML text.
     */
    var generateCoordText = function(count, coordNS, startTime) {
      var coordParts = [];

      for (var i = 0; i < count; i++) {
        var coord = [i / 100, i / 100, i];
        coordParts.push('<when>' + new Date(startTime + i * 1000).toISOString() + '</when>');
        coordParts.push('<' + coordNS + 'coord>' + coord.join(' ') + '</' + coordNS + 'coord>');
      }

      return coordParts.join('');
    };

    /**
     * Verify the coordinates for a track.
     * @param {!Array<!ol.Coordinate>} coordinates The coordinates.
     * @param {number} startTime The start time from `generateCoordText`.
     */
    var verifyCoordinates = function(coordinates, startTime) {
      for (var i = 0; i < coordinates.length; i++) {
        var coord = coordinates[i];
        expect(coord[0]).toEqual(i / 100);
        expect(coord[1]).toEqual(i / 100);
        expect(coord[2]).toEqual(i);
        expect(coord[3]).toEqual(startTime + i * 1000);
      }
    };

    /**
     * Run KML Track/MultiTrack tests with the provided namespace.
     * @param {string} namespace The track element namespace.
     * @param {string} xmlns The `xmlns` to include in documents.
     */
    var runTrackTests = function(namespace, xmlns) {
      it('parses ' + namespace + 'Track nodes', function() {
        var format = new KML();
        var startTime = Date.now();
        var numCoordinates = 20;
        var trackXml = '<Placemark' + (xmlns ? ' ' : '') + xmlns + '><' + namespace + 'Track>' +
            generateCoordText(numCoordinates, namespace, startTime) + '</' + namespace + 'Track></Placemark>';

        var doc = googDomXml.loadXml(trackXml);
        var trackEl = dom.getFirstElementChild(doc);

        var feature = format.readPlacemark_(trackEl, []);
        expect(feature).toBeDefined();

        var geometry = feature.getGeometry();
        expect(geometry instanceof LineString).toBe(true);
        expect(geometry.getLayout()).toBe(GeometryLayout.XYZM);

        var coordinates = geometry.getCoordinates();
        expect(coordinates.length).toEqual(numCoordinates);
        verifyCoordinates(coordinates, startTime);
      });

      it('parses ' + namespace + 'MultiTrack nodes', function() {
        var format = new KML();
        var startTime = Date.now();
        var numCoordinates = 20;
        var numTracks = 5;
        var trackXml = '<Placemark' + (xmlns ? ' ' : '') + xmlns + '><' + namespace + 'MultiTrack>';

        for (var i = 0; i < numTracks; i++) {
          trackXml += '<' + namespace + 'Track>' + generateCoordText(numCoordinates, namespace, startTime) +
              '</' + namespace + 'Track>;';
        }

        trackXml += '</' + namespace + 'MultiTrack></Placemark>';

        var doc = googDomXml.loadXml(trackXml);
        var trackEl = dom.getFirstElementChild(doc);

        var feature = format.readPlacemark_(trackEl, []);
        expect(feature).toBeDefined();

        var geometry = feature.getGeometry();
        expect(geometry instanceof MultiLineString).toBe(true);
        expect(geometry.getLayout()).toBe(GeometryLayout.XYZM);

        var lines = geometry.getLineStrings();
        expect(lines.length).toBe(numTracks);

        for (var i = 0; i < numTracks; i++) {
          var coordinates = lines[i].getCoordinates();
          expect(coordinates.length).toEqual(numCoordinates);
          verifyCoordinates(coordinates, startTime);
        }
      });

      it('parses ' + namespace + 'MultiTrack properties', function() {
        var format = new KML();
        var altitudeMode = 'clampToGround';
        var trackXml = '<Placemark' + (xmlns ? ' ' : '') + xmlns + '><' + namespace + 'MultiTrack>' +
            '<' + namespace + 'interpolate>1</' + namespace + 'interpolate>' +
            '<altitudeMode>' + altitudeMode + '</altitudeMode>' +
            '</' + namespace + 'MultiTrack></Placemark>';

        var doc = googDomXml.loadXml(trackXml);
        var trackEl = dom.getFirstElementChild(doc);

        var feature = format.readPlacemark_(trackEl, []);
        expect(feature).toBeDefined();

        var geometry = feature.getGeometry();
        expect(geometry instanceof MultiLineString).toBe(true);
        expect(geometry.get('interpolate')).toBe(true);
        expect(geometry.get('altitudeMode')).toBe(altitudeMode);
      });
    };

    // run track tests for KML 2.2 w/ gx namespace, and KML 2.3 with no namespace
    runTrackTests('gx:', 'xmlns:gx="http://www.google.com/kml/ext/2.2"');
    runTrackTests('', '');
  });
});
