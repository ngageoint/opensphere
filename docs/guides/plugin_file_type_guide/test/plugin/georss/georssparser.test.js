goog.require('plugin.georss.GeoRSSParser');

import {parse} from 'ol/src/xml.js';

describe('plugin.georss.GeoRSSParser', function() {
  const {default: GeoRSSParser} = goog.module.get('plugin.georss.GeoRSSParser');

  it('should parse points correctly', function() {
    var el = parse('<point>  40    -105  ' +
      '</point>').firstElementChild;

    var geom = GeoRSSParser.parseGeometry(el);

    expect(geom instanceof ol.geom.Point).toBe(true);
    expect(geom.getCoordinates()[0]).toBe(-105);
    expect(geom.getCoordinates()[1]).toBe(40);
  });

  it('should choose the first point if there is more than one', function() {
    var el = parse('<point>40 -105 50 -95</point>').firstElementChild;

    var geom = GeoRSSParser.parseGeometry(el);

    expect(geom instanceof ol.geom.Point).toBe(true);
    expect(geom.getCoordinates()[0]).toBe(-105);
    expect(geom.getCoordinates()[1]).toBe(40);
  });

  it('should return undefined when pairs for point are incomplete', function() {
    var el = parse('<point>40 -105 50</point>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should return undefined when points do not contain adequate coordinate pairs', function() {
    var el = parse('<point></point>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should not parse nonsense', function() {
    var el = parse('<point>10 yang</point>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);

    el = parse('<point>ying 10</point>').firstElementChild;
    geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should parse lines correctly', function() {
    var el = parse('<line>40 100 50 110</line>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom instanceof ol.geom.LineString).toBe(true);
    expect(geom.getCoordinates()[0][0]).toBe(100);
    expect(geom.getCoordinates()[0][1]).toBe(40);
    expect(geom.getCoordinates()[1][0]).toBe(110);
    expect(geom.getCoordinates()[1][1]).toBe(50);
  });

  it('should return undefined when pairs for lines are incomplete', function() {
    var el = parse('<line>40 100 50 110 60</line>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should return undefined when lines do not contain adequate coordinate pairs', function() {
    var el = parse('<line>40 100</line>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should parse polygons correctly', function() {
    var el = parse('<polygon>40 100 50 110 60 100</polygon>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom instanceof ol.geom.Polygon).toBe(true);
    expect(geom.getCoordinates()[0][0][0]).toBe(100);
    expect(geom.getCoordinates()[0][0][1]).toBe(40);
    expect(geom.getCoordinates()[0][1][0]).toBe(110);
    expect(geom.getCoordinates()[0][1][1]).toBe(50);
    expect(geom.getCoordinates()[0][2][0]).toBe(100);
    expect(geom.getCoordinates()[0][2][1]).toBe(60);
  });

  it('should return undefined when pairs for polygons are incomplete', function() {
    var el = parse('<polygon>40 100 50 110 60 100 70</polygon>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should return undefined when polygons do not contain adequate coordinate pairs', function() {
    var el = parse('<polygon>40 100 50 110</polygon>').firstElementChild;
    var geom = GeoRSSParser.parseGeometry(el);
    expect(geom).toBe(undefined);
  });

  it('should return undefined for incorrect tag names', function() {
    var el = parse('<something>is wrong here</something>').firstElementChild;
    expect(GeoRSSParser.parseGeometry(el)).toBe(undefined);
  });

  it('should parse GeoRSS feeds', function() {
    var p = new GeoRSSParser();

    var feed = '<?xml version="1.0" encoding="utf-8"?>' +
      '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:georss="http://www.georss.org/georss">' +
         '<title>Earthquakes</title>' +
         '<subtitle>International earthquake observation labs</subtitle>' +
         '<link href="http://example.org/"/>' +
         '<updated>2005-12-13T18:30:02Z</updated>' +
         '<author>' +
            '<name>Dr. Thaddeus Remor</name>' +
            '<email>tremor@quakelab.edu</email>' +
         '</author>' +
         '<id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>' +
         '<entry>' +
            '<title>M 3.2, Mona Passage</title>' +
            '<link href="http://example.org/2005/09/09/atom01"/>' +
            '<id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>' +
            '<updated>2005-08-17T07:02:32Z</updated>' +
            '<summary>We just had a big one.</summary>' +
            '<georss:point>45.256 -71.92</georss:point>' +
            // we want to make sure this is properly ignored for now, we'll leave it as an
            // exercise for the user to implement it
            '<georss:elev>-19372</georss:elev>' +
          '</entry>' +
      '</feed>';

    p.setSource(feed);
    expect(p.hasNext()).toBe(true);

    var source = parse(feed);
    p.setSource(source);
    expect(p.hasNext()).toBe(true);

    var feature = p.parseNext();

    expect(p.hasNext()).toBe(false);
    expect(feature instanceof ol.Feature).toBe(true);
    expect(feature.get('title')).toBe('M 3.2, Mona Passage');
    expect(feature.get('link')).toBe('http://example.org/2005/09/09/atom01');
    expect(feature.get('id')).toBe('urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a');
    expect(feature.get('updated')).toBe('2005-08-17T07:02:32Z');
    expect(feature.get('summary')).toBe('We just had a big one.');
    expect(feature.getGeometry() instanceof ol.geom.Point).toBe(true);

    p.cleanup();
    expect(p.hasNext()).toBe(false);
    expect(p.document).toBe(null);
    expect(p.entries).toBe(null);
    expect(p.nextIndex).toBe(0);
  });

  it('should not use other potential sources', function() {
    var p = new GeoRSSParser();
    p.setSource({something: true});
    expect(p.document).toBe(null);
    expect(p.hasNext()).toBe(false);
  });
});
