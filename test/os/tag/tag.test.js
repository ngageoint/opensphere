goog.require('goog.dom');
goog.require('os.tag');

describe('os.tag', function() {
  const dom = goog.module.get('goog.dom');
  const tag = goog.module.get('os.tag');

  var tagString = '  a  , b,   c  d  ,  e   ';
  var tagArray = ['a', 'b', 'c'];

  it('converts a tag string to an array', function() {
    var arr = tag.tagsFromString(tagString);
    expect(arr.length).toBe(4);
    expect(arr[0]).toBe('a');
    expect(arr[1]).toBe('b');
    expect(arr[2]).toBe('c  d');
    expect(arr[3]).toBe('e');
  });

  it('converts a tag array to a string', function() {
    var str = tag.stringFromTags(tagArray);
    expect(str).toBe('a, b, c');
  });

  it('converts an tag string/array to an XML element', function() {
    // test converting a string to an element, using the default root tag
    var strEl = tag.xmlFromTags(tagString);
    expect(strEl instanceof Element).toBe(true);
    expect(strEl.localName).toBe(tag.DEFAULT_XML_ROOT);

    var children = dom.getChildren(strEl);
    expect(children).not.toBeNull();
    expect(children.length).toBe(4);

    var arr = tag.tagsFromString(tagString);
    for (var i = 0, n = children.length; i < n; i++) {
      expect(children[i].localName).toBe(tag.DEFAULT_XML_TAG);
      expect(children[i].textContent).toBe(arr[i]);
    }

    // test converting an array to an element, now using a custom root tag
    var customTag = 'my-tags';
    var arrEl = tag.xmlFromTags(tagArray, customTag);
    expect(arrEl instanceof Element).toBe(true);
    expect(arrEl.localName).toBe(customTag);

    var children = dom.getChildren(arrEl);
    expect(children).not.toBeNull();
    expect(children.length).toBe(3);
    for (var i = 0, n = children.length; i < n; i++) {
      expect(children[i].localName).toBe(tag.DEFAULT_XML_TAG);
      expect(children[i].textContent).toBe(tagArray[i]);
    }
  });

  it('converts an XML element to a tag array', function() {
    var arrEl = tag.xmlFromTags(tagArray);
    var tags = tag.tagsFromXML(arrEl);

    expect(tags).not.toBeNull();
    expect(tags.length).toBe(tagArray.length);

    for (var i = 0, n = tags.length; i < n; i++) {
      expect(tags[i]).toBe(tagArray[i]);
    }
  });

  it('converts an XML element to a tag string', function() {
    var arrEl = tag.xmlFromTags(tagArray);
    var str = tag.stringFromXML(arrEl);
    expect(str).toBe('a, b, c');
  });
});
