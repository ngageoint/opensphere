goog.require('os.ol.source.XYZ');
goog.require('ol.proj.common');


describe('os.ol.source.XYZ', function() {
  it('should apply the offset to the zoom', function() {
    var url = 'http://example.com/layer/{z}/{y}/{x}';
    ol.proj.common.add();

    var src = new os.ol.source.XYZ({
      'tileSize': 512,
      'zoomOffset': -1,
      'url': url
    });

    var fn = src.createFromTemplate(url);

    // get url for tile z=2, x=2, y=-1
    url = fn([2, 2, -1]);
    expect(url).toBe('http://example.com/layer/1/0/2');

    // get url for tile z=9, x=511, y=-256
    url = fn([9, 511, -256]);
    expect(url).toBe('http://example.com/layer/8/255/511');
  });
});
