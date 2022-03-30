goog.require('os.style.TextReader');

import Fill from 'ol/src/style/Fill.js';
import Text from 'ol/src/style/Text.js';
import TextPlacement from 'ol/src/style/TextPlacement.js';

describe('os.style.TextReader', function() {
  const {default: TextReader} = goog.module.get('os.style.TextReader');

  let config;
  let reader;

  beforeEach(function() {
    config = {
      text: 'Test label!',
      textAlign: 'yep',
      textBaseline: 'here',
      placement: TextPlacement.LINE,
      font: 'bold 72px/72px Comic Sans',
      fillColor: 'rgba(255,255,0,1)',
      strokeColor: 'rgba(255,0,255,1)',
      strokeWidth: 5,
      offsetX: 12,
      offsetY: 34,
      extraProperty: true
    };

    reader = new TextReader();
  });

  it('should create a text style', function() {
    const text = reader.getOrCreateStyle(config);
    expect(text.getText()).toBe(config.text);
    expect(text.getTextAlign()).toBe(config.textAlign);
    expect(text.getTextBaseline()).toBe(config.textBaseline);
    expect(text.getPlacement()).toBe(config.placement);
    expect(text.getFont()).toBe(config.font);
    expect(text.getFill().getColor()).toBe(config.fillColor);
    expect(text.getStroke().getColor()).toBe(config.strokeColor);
    expect(text.getStroke().getWidth()).toBe(config.strokeWidth);
    expect(text.getOffsetX()).toBe(config.offsetX);
    expect(text.getOffsetY()).toBe(config.offsetY);
  });

  it('should convert a style to a config', function() {
    const config = {};
    const style = new Text({
      fill: new Fill({
        color: 'rgba(255,0,255,1)'
      })
    });

    reader.toConfig(style, config);

    expect(config.labelColor).toBe(style.getFill().getColor());
  });
});
