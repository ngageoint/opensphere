goog.require('os.state');

describe('os.state', () => {
  const {
    isLayerRemote,
    registerLayerStateUrlProperty
  } = goog.module.get('os.state');

  it('tests if a layer is remote', () => {
    const layerOptions = {};
    expect(isLayerRemote(layerOptions)).toBe(false);

    layerOptions['notATestedUrl'] = 'https://www.google.com/';
    expect(isLayerRemote(layerOptions)).toBe(false);

    layerOptions['url'] = 'local://not-remote/';
    expect(isLayerRemote(layerOptions)).toBe(false);

    layerOptions['url2'] = 'https://url.is.not/remote/';
    expect(isLayerRemote(layerOptions)).toBe(false);

    layerOptions['url'] = 'http://now.its/remote';
    expect(isLayerRemote(layerOptions)).toBe(true);

    layerOptions['urls'] = ['https://one.remote/', 'file://not-the-other/'];
    expect(isLayerRemote(layerOptions)).toBe(false);

    layerOptions['urls'] = ['https://one.remote/', 'ftp://and.the/other'];
    expect(isLayerRemote(layerOptions)).toBe(true);
  });

  it('registers url properties to test for layer states', () => {
    const layerOptions = {
      'myUrlProperty': ['https://some.url.com']
    };
    expect(isLayerRemote(layerOptions)).toBe(false);

    registerLayerStateUrlProperty('myUrlProperty');
    expect(isLayerRemote(layerOptions)).toBe(true);
  });
});
