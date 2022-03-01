goog.require('goog.dom.xml');
goog.require('os.xml');

describe('os.xml', function() {
  const googDomXml = goog.module.get('goog.dom.xml');
  const osXml = goog.module.get('os.xml');

  var doc = googDomXml.createDocument();
  var testTag = 'test';
  var testTagNs = 'bits:' + testTag;
  var testNs = 'http://this.is.a/test';
  var testContent = 'test content!';
  var testAttrs = {
    'first': 'a',
    'second': 'b'
  };

  it('creates an element', function() {
    expect(doc.firstChild).toBeNull();

    var el = osXml.createElement(testTag, doc, testContent, testAttrs);
    expect(doc.firstChild).toBeNull();
    expect(el).not.toBeNull();
    expect(el.localName).toBe(testTag);
    expect(el.textContent).toBe(testContent);

    for (var key in testAttrs) {
      expect(el.getAttribute(key)).toBe(testAttrs[key]);
    }
  });

  it('creates an element and adds it to a parent', function() {
    var el = osXml.createElement(testTag, doc);
    expect(el.firstChild).toBeNull();

    var el2 = osXml.appendElement(testTag, el, testContent, testAttrs);
    expect(el2).not.toBeNull();
    expect(el.firstChild).toBe(el2);
    expect(el.querySelector(testTag)).toBe(el2);
    expect(el2.localName).toBe(testTag);
    expect(el2.textContent).toBe(testContent);

    for (var key in testAttrs) {
      expect(el2.getAttribute(key)).toBe(testAttrs[key]);
    }
  });

  it('creates a namespaced element', function() {
    expect(doc.firstChild).toBeNull();

    var el = osXml.createElementNS(testTagNs, testNs, doc, testContent, testAttrs);
    expect(doc.firstChild).toBeNull();
    expect(el).not.toBeNull();
    expect(el.localName).toBe(testTag);
    expect(el.nodeName).toBe(testTagNs);
    expect(el.namespaceURI).toBe(testNs);
    expect(el.textContent).toBe(testContent);

    for (var key in testAttrs) {
      expect(el.getAttribute(key)).toBe(testAttrs[key]);
    }
  });

  it('creates a namespaced element and adds it to a parent', function() {
    var el = osXml.createElementNS(testTagNs, testNs, doc);
    expect(el.firstChild).toBeNull();

    var el2 = osXml.appendElementNS(testTagNs, testNs, el, testContent, testAttrs);
    expect(el2).not.toBeNull();
    expect(el.firstChild).toBe(el2);
    expect(el.querySelector(testTag)).toBe(el2);
    expect(el2.localName).toBe(testTag);
    expect(el2.nodeName).toBe(testTagNs);
    expect(el2.namespaceURI).toBe(testNs);
    expect(el2.textContent).toBe(testContent);

    for (var key in testAttrs) {
      expect(el2.getAttribute(key)).toBe(testAttrs[key]);
    }
  });

  it('should parse a date from a node', function() {
    var now = new Date(Date.now());

    // actual date string
    var el = osXml.createElementNS(testTagNs, testNs, doc, now.toISOString());
    var testDate = osXml.readDateTime(el);
    expect(testDate.getTime()).toBe(now.getTime());

    // test non-date tag
    el = osXml.createElementNS(testTagNs, testNs, doc, 'NOPE');
    testDate = osXml.readDateTime(el);
    expect(testDate).toBeNull();

    // test empty tag
    el = osXml.createElementNS(testTagNs, testNs, doc);
    testDate = osXml.readDateTime(el);
    expect(testDate).toBeNull();

    // test tag with spaces
    var el = osXml.createElementNS(testTagNs, testNs, doc, now.toISOString() + '   ');
    var testDate = osXml.readDateTime(el);
    expect(testDate.getTime()).toBe(now.getTime());
  });

  it('should return a node value or default', function() {
    var docRoot = googDomXml.createDocument();
    var root = osXml.appendElement('thedoc', docRoot);

    // Add element to test.
    var vlNode = osXml.appendElement('val', root, 'cool');
    var v1 = osXml.getElementValueOrDefault(vlNode, 'defaultVal');
    expect(v1).toBe('cool');
    var emptyNode = osXml.appendElement('val2', root);
    var v2 = osXml.getElementValueOrDefault(emptyNode, 'defaultVal');
    expect(v2).toBe('defaultVal');

    // passing a falsey  should also return the default
    var v3 = osXml.getElementValueOrDefault(undefined, 'defaultVal');
    expect(v3).toBe('defaultVal');
  });

  it('should get the text value of a child element', function() {
    var docRoot = googDomXml.createDocument();
    var root = osXml.appendElement('thedoc', docRoot);

    expect(osXml.getChildValue(root, 'child')).toBeNull();
    expect(osXml.getChildValue(root, 'subchild')).toBeNull();
    expect(osXml.getChildValue(root, 'emptychild')).toBeNull();

    var childEl = osXml.appendElement('child', root);
    expect(osXml.getChildValue(root, 'child')).toBeNull();
    expect(osXml.getChildValue(root, 'subchild')).toBeNull();
    expect(osXml.getChildValue(root, 'emptychild')).toBeNull();

    osXml.appendElement('subchild', childEl, 'subChildVal');
    expect(osXml.getChildValue(root, 'child')).toBe('subChildVal');
    expect(osXml.getChildValue(root, 'subchild')).toBe('subChildVal');
    expect(osXml.getChildValue(root, 'emptychild')).toBeNull();

    osXml.appendElement('emptychild', childEl);
    expect(osXml.getChildValue(root, 'child')).toBe('subChildVal');
    expect(osXml.getChildValue(root, 'subchild')).toBe('subChildVal');
    expect(osXml.getChildValue(root, 'emptychild')).toBeNull();
  });

  it('should detect and scrub xsi: namespaces out from XML that it loads', function() {
    var xml = '<Document xsi:schemaLocation="http://www.opengis.net/kml/2.2 ' +
        'http://schemas.opengis.net/kml/2.2.0/ogckml22.xsd http://www.google.com/kml/ext/2.2 ' +
        'http://code.google.com/apis/kml/schema/kml22gx.xsd"></Document>';
    var result = xml.replace(osXml.XSI_REGEX, '');
    expect(result.indexOf('xsi:schemaLocation')).toBe(-1);

    xml += '<Document xsi:schemaLocation="http://www.opengis.net/kml/2.2 ' +
        'http://schemas.opengis.net/kml/2.2.0/ogckml22.xsd"></Document>';
    result = xml.replace(osXml.XSI_REGEX, '');
    expect(result.indexOf('xsi:schemaLocation')).toBe(-1);
  });
});
