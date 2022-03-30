goog.require('os.ol.source.XYZ');

describe('os.ol.source.XYZ', function() {
  const {default: XYZ} = goog.module.get('os.ol.source.XYZ');

  it('should apply the offset to the zoom', function() {
    var url = 'http://example.com/layer/{z}/{y}/{x}';

    var src = new XYZ({
      'tileSize': 512,
      'zoomOffset': -1,
      'url': url
    });

    var fn = src.createFromTemplate(url);

    // get url for tile z=2, x=2, y=0
    url = fn([2, 2, 0]);
    expect(url).toBe('http://example.com/layer/1/0/2');

    // get url for tile z=9, x=511, y=-255
    url = fn([9, 511, 255]);
    expect(url).toBe('http://example.com/layer/8/255/511');
  });
});
