goog.require('os.tag');
goog.require('goog.dom');

describe('os.tag', function() {
  var tagString = '  a  , b,   c  d  ,  e   ';
  var tagArray = ['a', 'b', 'c'];

  it('converts a tag string to an array', function() {
    var arr = os.tag.tagsFromString(tagString);
    expect(arr.length).toBe(4);
    expect(arr[0]).toBe('a');
    expect(arr[1]).toBe('b');
    expect(arr[2]).toBe('c  d');
    expect(arr[3]).toBe('e');
  });

  it('converts a tag array to a string', function() {
    var str = os.tag.stringFromTags(tagArray);
    expect(str).toBe('a, b, c');
  });

  it('converts an tag string/array to an XML element', function() {
    // test converting a string to an element, using the default root tag
    var strEl = os.tag.xmlFromTags(tagString);
    expect(strEl instanceof Element).toBe(true);
    expect(strEl.localName).toBe(os.tag.DEFAULT_XML_ROOT);

    var children = goog.dom.getChildren(strEl);
    expect(children).not.toBeNull();
    expect(children.length).toBe(4);

    var arr = os.tag.tagsFromString(tagString);
    for (var i = 0, n = children.length; i < n; i++) {
      expect(children[i].localName).toBe(os.tag.DEFAULT_XML_TAG);
      expect(children[i].textContent).toBe(arr[i]);
    }

    // test converting an array to an element, now using a custom root tag
    var customTag = 'my-tags';
    var arrEl = os.tag.xmlFromTags(tagArray, customTag);
    expect(arrEl instanceof Element).toBe(true);
    expect(arrEl.localName).toBe(customTag);

    var children = goog.dom.getChildren(arrEl);
    expect(children).not.toBeNull();
    expect(children.length).toBe(3);
    for (var i = 0, n = children.length; i < n; i++) {
      expect(children[i].localName).toBe(os.tag.DEFAULT_XML_TAG);
      expect(children[i].textContent).toBe(tagArray[i]);
    }
  });

  it('converts an XML element to a tag array', function() {
    var arrEl = os.tag.xmlFromTags(tagArray);
    var tags = os.tag.tagsFromXML(arrEl);

    expect(tags).not.toBeNull();
    expect(tags.length).toBe(tagArray.length);

    for (var i = 0, n = tags.length; i < n; i++) {
      expect(tags[i]).toBe(tagArray[i]);
    }
  });

  it('converts an XML element to a tag string', function() {
    var arrEl = os.tag.xmlFromTags(tagArray);
    var str = os.tag.stringFromXML(arrEl);
    expect(str).toBe('a, b, c');
  });
});
