goog.require('os.ogc.wmts.AbstractWMTSLayerParser');

describe('os.ogc.wmts.AbstractWMTSLayerParser', () => {
  const {default: AbstractWMTSLayerParser} = goog.module.get('os.ogc.wmts.AbstractWMTSLayerParser');

  const parser = new AbstractWMTSLayerParser();

  it('parses the layer identifier', () => {
    expect(parser.parseLayerId()).toBeNull();
    expect(parser.parseLayerId({})).toBeNull();

    expect(parser.parseLayerId({Identifier: 'testId'})).toBe('testId');
  });

  it('parses the layer title', () => {
    expect(parser.parseLayerTitle()).toBeNull();
    expect(parser.parseLayerTitle({})).toBeNull();

    expect(parser.parseLayerTitle({Title: 'Test Title'})).toBe('Test Title');
  });
});
