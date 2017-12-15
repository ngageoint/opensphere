goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('os.parse.RssParser');

describe('os.parse.RssParser', function() {
  var dataUrl = '/base/test/os/parse/rss/rsstest.xml';
  var rss = new os.parse.RssParser();
  var numItems = 3;

  var rssData;

  it('requests RSS test data', function() {
    var xhr = new goog.net.XhrIo();
    xhr.listen(goog.net.EventType.SUCCESS, function() {
      rssData = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(dataUrl);
    });

    waitsFor(function() {
      return rssData != null;
    }, 'test data to load');

    runs(function() {
      expect(rssData).toBeDefined();
      expect(rssData.length).toBeGreaterThan(0);
    });
  });

  it('loads items from a source', function() {
    expect(rss.items).toBeNull();
    expect(rss.nextIndex).toBe(0);
    expect(rss.hasNext()).toBe(false);

    spyOn(rss, 'cleanup').andCallThrough();

    rss.setSource(rssData);
    expect(rss.cleanup).toHaveBeenCalled();
    expect(rss.items).toBeDefined();
    expect(rss.items.length).toBe(numItems);
    expect(rss.nextIndex).toBe(0);
    expect(rss.hasNext()).toBe(true);
  });

  it('parses items to JSON objects', function() {
    var baseDate = new Date('Thu, 16 Mar 2017 06:00:00 -0600');

    for (var i = 0; i < numItems; i++) {
      expect(rss.hasNext()).toBe(true);
      expect(rss.nextIndex).toBe(i);

      baseDate.setSeconds(i);

      var item = rss.parseNext();
      expect(item).toBeDefined();
      expect(item.title).toBe('Test Item ' + i);
      expect(item.description).toBe('Test Item ' + i + ' Description');
      expect(new Date(item.pubDate).getTime()).toBe(baseDate.getTime());
      expect(item.link).toBe('http://opensphere.com/test/report/' + i);
      expect(item.guid).toBe('test-id-' + i);

      expect(item.ns1).toBeDefined();
      expect(item.ns1.field0).toBe('item' + i + ' ns1 value0');
      expect(item.ns1.field1).toBe('item' + i + ' ns1 value1');
      expect(item.ns1.field2).toBe('item' + i + ' ns1 value2');

      expect(item.ns2).toBeDefined();
      expect(item.ns2.field0).toBe('item' + i + ' ns2 value0');
      expect(item.ns2.field1).toBe('item' + i + ' ns2 value1');
      expect(item.ns2.field2).toBe('item' + i + ' ns2 value2');
    }

    expect(rss.hasNext()).toBe(false);
  });

  it('cleans up', function() {
    expect(rss.hasNext()).toBe(false);
    rss.nextIndex = 0;
    expect(rss.hasNext()).toBe(true);

    rss.cleanup();
    expect(rss.items).toBeNull();
    expect(rss.nextIndex).toBe(0);
    expect(rss.hasNext()).toBe(false);
  });
});
