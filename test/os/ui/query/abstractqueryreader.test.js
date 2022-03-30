goog.require('goog.dom.xml');
goog.require('os.ui.query.AbstractQueryReader');

import Polygon from 'ol/src/geom/Polygon.js';

describe('os.ui.query.AbstractQueryReader', function() {
  const xml = goog.module.get('goog.dom.xml');
  const {default: AbstractQueryReader} = goog.module.get('os.ui.query.AbstractQueryReader');

  var bboxXml = '<gml:Envelope xmlns:gml="http://www.opengis.net/gml" srsName="CRS:84">' +
      '<gml:lowerCorner>-23.1976318359375 14.941406250000007</gml:lowerCorner>' +
      '<gml:upperCorner>-15.9906005859375 20.742187500000007</gml:upperCorner>' +
      '</gml:Envelope>';

  it('should properly parse a GML3 BBOX into an ol.Feature', function() {
    var element = xml.loadXml(bboxXml);
    var feature = AbstractQueryReader.parseArea(element.firstChild);
    expect(feature).not.toBe(null);
    expect(feature.getGeometry() instanceof Polygon).toBe(true);

    var coordinates = feature.getGeometry().getCoordinates()[0];
    expect(coordinates[0][0]).toBe(-23.1976318359375);
    expect(coordinates[0][1]).toBe(20.742187500000007);

    expect(coordinates[1][0]).toBe(-15.9906005859375);
    expect(coordinates[1][1]).toBe(20.742187500000007);

    expect(coordinates[2][0]).toBe(-15.9906005859375);
    expect(coordinates[2][1]).toBe(14.941406250000007);

    expect(coordinates[3][0]).toBe(-23.1976318359375);
    expect(coordinates[3][1]).toBe(14.941406250000007);

    expect(coordinates[4][0]).toBe(-23.1976318359375);
    expect(coordinates[4][1]).toBe(20.742187500000007);
  });

  var polygonXml = '<gml:Polygon xmlns:gml="http://www.opengis.net/gml">' +
      '<gml:exterior>' +
      '<gml:LinearRing>' +
      '<gml:posList srsDimension="2" srsName="CRS:84">' +
      '35.804869764017916 35.984276795127215 35.299498670267916 35.566796326377215 35.453307264017916 ' +
      '34.92958929512721 35.453307264017916 34.665917420127215 35.804869764017916 35.984276795127215' +
      '</gml:posList>' +
      '</gml:LinearRing>' +
      '</gml:exterior>' +
      '</gml:Polygon>';

  it('should properly parse a GML3 Polygon into an ol.Feature', function() {
    var element = xml.loadXml(polygonXml);
    var feature = AbstractQueryReader.parseArea(element.firstChild);
    expect(feature).not.toBe(null);
    expect(feature.getGeometry() instanceof Polygon).toBe(true);

    var coordinates = feature.getGeometry().getCoordinates()[0];
    expect(coordinates[0][0]).toBe(35.804869764017916);
    expect(coordinates[0][1]).toBe(35.984276795127215);

    expect(coordinates[1][0]).toBe(35.299498670267916);
    expect(coordinates[1][1]).toBe(35.566796326377215);

    expect(coordinates[2][0]).toBe(35.453307264017916);
    expect(coordinates[2][1]).toBe(34.92958929512721);

    expect(coordinates[3][0]).toBe(35.453307264017916);
    expect(coordinates[3][1]).toBe(34.665917420127215);

    expect(coordinates[4][0]).toBe(35.804869764017916);
    expect(coordinates[4][1]).toBe(35.984276795127215);
  });
});
