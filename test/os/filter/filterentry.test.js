goog.require('os.filter.FilterEntry');


describe('os.filter.FilterEntry', function() {
  var filterXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>PROPERTY</PropertyName>' +
      '<Literal>AAA*</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  it('should initialize correctly', function() {
    var fe = new os.filter.FilterEntry();

    expect(goog.isString(fe.getId())).toBe(true);
    expect(fe.getMatch()).toBe(true);
    expect(fe.isTemporary()).toBe(false);
    expect(fe.getTitle()).toBe('New Filter');
  });

  it('should take an XML filter entry and maintain it as a Node', function() {
    var fe = new os.filter.FilterEntry();
    expect(fe.getFilterNode()).toBe(null);
    fe.setFilter(filterXml);

    var filterNode = fe.getFilterNode();
    expect(filterNode).not.toBe(null);
    expect(filterNode.localName).toBe('And');
    expect(filterNode.getAttribute('namehint')).toBe('Test Keep Filter Name');

    var pis = filterNode.querySelector('PropertyIsLike');
    expect(pis).not.toBe(null);
    expect(pis.localName).toBe('PropertyIsLike');
    expect(pis.getAttribute('escape')).toBe('\\');
    expect(pis.getAttribute('singleChar')).toBe('.');
    expect(pis.getAttribute('wildCard')).toBe('*');

    var pn = filterNode.querySelector('PropertyName');
    expect(pn).not.toBe(null);
    expect(pn.textContent).toBe('PROPERTY');

    var literal = filterNode.querySelector('Literal');
    expect(literal).not.toBe(null);
    expect(literal.textContent).toBe('AAA*');
  });

  it('should clone/persist/restore properly', function() {
    var fe = new os.filter.FilterEntry();
    var id = fe.getId();
    fe.setTitle('Clone Me');
    fe.setDescription('Description Boys');
    fe.type = 'LAYER#features';
    fe.setFilter(filterXml);
    fe.setMatch(false);

    var clone = fe.clone();
    expect(clone.getId()).toBe(id);
    expect(clone.getTitle()).toBe('Clone Me');
    expect(clone.getDescription()).toBe('Description Boys');
    expect(clone.type).toBe('LAYER#features');
    expect(clone.getFilter()).toBe(filterXml);
    expect(clone.getFilterNode()).not.toBe(null);
    expect(clone.getMatch()).toBe(false);
  });

  var featureTypeColumns = [
    {
      'name': 'Altitude',
      'type': 'decimal'
    },
    {
      'name': 'Identifier',
      'type': 'string'
    },
    {
      'name': 'Speed',
      'type': 'decimal'
    },
    {
      'name': 'Value',
      'type': 'string'
    },
    {
      'name': 'GEOM',
      'type': 'gml:PointPropertyType'
    }
  ];

  var altitudeXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>9999</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var badAltitudeXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>ABCD</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var notInFeatureTypeXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>NotInType</PropertyName>' +
      '<Literal>somevalue</Literal>' +
      '</PropertyIsLike>' +
      '</And>';

  var isNullXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<PropertyIsNull>' +
      '<PropertyName>Speed</PropertyName>' +
      '</PropertyIsNull>' +
      '</And>';

  it('should match simple filters properly against a set of columns', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(altitudeXml);
    expect(fe.matches(featureTypeColumns)).toBe(true);
  });

  it('should NOT match simple filters when the column type does not match', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(badAltitudeXml);
    expect(fe.matches(featureTypeColumns)).toBe(false);
  });

  it('should NOT match simple filters when the column name is not in the columns', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(notInFeatureTypeXml);
    expect(fe.matches(featureTypeColumns)).toBe(false);
  });

  it('should not explode when it sees no Literal (i.e. for a PropertyIsNull filter)', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(isNullXml);
    expect(fe.matches(featureTypeColumns)).toBe(true);
  });

  var advancedXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<Or>' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>9999</Literal>' +
      '</PropertyIsLike>' +
      '<PropertyIsNull>' +
      '<PropertyName>Speed</PropertyName>' +
      '</PropertyIsNull>' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Value</PropertyName>' +
      '<Literal>ABCD</Literal>' +
      '</PropertyIsLike>' +
      '<And>' +
      '<PropertyIsGreaterThan escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>100000</Literal>' +
      '</PropertyIsGreaterThan>' +
      '<PropertyIsLessThan escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>200000</Literal>' +
      '</PropertyIsLessThan>' +
      '</And>' +
      '</Or>' +
      '</And>';

  it('should match filters properly against an advanced filter', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(advancedXml);
    expect(fe.matches(featureTypeColumns)).toBe(true);
  });

  var badAdvancedXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<Or>' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>9999</Literal>' +
      '</PropertyIsLike>' +
      '<PropertyIsNull>' +
      '<PropertyName>Speed</PropertyName>' +
      '</PropertyIsNull>' +
      '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Value</PropertyName>' +
      '<Literal>ABCD</Literal>' +
      '</PropertyIsLike>' +
      '<And>' +
      '<PropertyIsGreaterThan escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>BADVALUEBOYS</Literal>' +
      '</PropertyIsGreaterThan>' +
      '<PropertyIsLessThan escape="\\" singleChar="." wildCard="*">' +
      '<PropertyName>Altitude</PropertyName>' +
      '<Literal>200000</Literal>' +
      '</PropertyIsLessThan>' +
      '</And>' +
      '</Or>' +
      '</And>';

  it('should NOT match advanced filters when the column type does not match', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(badAdvancedXml);
    expect(fe.matches(featureTypeColumns)).toBe(false);
  });

  var geometryXml = '<And xmlns="http://www.opengis.net/ogc" namehint="Test Keep Filter Name">' +
      '<BBOX xmlns="http://www.opengis.net/ogc" areanamehint="temp area 1">' +
      '<PropertyName>GEOM</PropertyName>' +
      '<gml:Envelope xmlns:gml="http://www.opengis.net/gml" srsName="CRS:84">' +
      '<gml:lowerCorner>-23.1976318359375 14.941406250000007</gml:lowerCorner>' +
      '<gml:upperCorner>-15.9906005859375 20.742187500000007</gml:upperCorner>' +
      '</gml:Envelope>' +
      '</BBOX>' +
      '</And>';

  it('should NOT match a geometry field', function() {
    var fe = new os.filter.FilterEntry();
    fe.setFilter(geometryXml);
    expect(fe.matches(featureTypeColumns)).toBe(false);
  });
});
