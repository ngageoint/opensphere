goog.require('os.data.RecordField');
goog.require('os.data.histo.ColorBin');
goog.require('os.feature');

import Feature from 'ol/src/Feature.js';

describe('os.data.histo.ColorBin', function() {
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: ColorBin} = goog.module.get('os.data.histo.ColorBin');
  const osFeature = goog.module.get('os.feature');

  var red = new Feature();
  red.set(RecordField.COLOR, '#f00');
  var green = new Feature();
  green.set(RecordField.COLOR, '#0f0');
  var blue = new Feature();
  blue.set(RecordField.COLOR, '#00f');

  it('should add items and increment the color counts', function() {
    var bin = new ColorBin('#ff00ff');
    bin.setColorFunction(function(item) {
      return (
        /** @type {string|undefined} */ osFeature.getColor(/** @type {!olFeature} */ (item))
      );
    });

    bin.addItem(red);
    expect(bin.getColorCounts()['#ff0000']).toBe(1);

    bin.addItem(green);
    expect(bin.getColorCounts()['#00ff00']).toBe(1);

    bin.addItem(blue);
    expect(bin.getColorCounts()['#0000ff']).toBe(1);
  });

  it('should add items and decrement the color counts', function() {
    var bin = new ColorBin('#ff00ff');
    bin.setColorFunction(function(item) {
      return (
        /** @type {string|undefined} */ osFeature.getColor(/** @type {!olFeature} */ (item))
      );
    });
    bin.addItem(red);
    bin.addItem(green);
    bin.addItem(blue);

    // remove them and expect the color counts to be gone
    bin.removeItem(red);
    expect(bin.getColorCounts()['#ff0000']).toBe(undefined);

    bin.removeItem(green);
    expect(bin.getColorCounts()['#00ff00']).toBe(undefined);

    bin.removeItem(blue);
    expect(bin.getColorCounts()['#0000ff']).toBe(undefined);
  });

  it('should return a color if all items are the same color', function() {
    var bin = new ColorBin('#ff00ff');
    bin.setColorFunction(function(item) {
      return (
        /** @type {string|undefined} */ osFeature.getColor(/** @type {!olFeature} */ (item))
      );
    });
    bin.addItem(red);

    expect(bin.getColor()).toBe('#ff0000');
  });

  it('should NOT return a color if not all items are the same color', function() {
    var bin = new ColorBin('#ff00ff');
    bin.setColorFunction(function(item) {
      return (
        /** @type {string|undefined} */ osFeature.getColor(/** @type {!olFeature} */ (item))
      );
    });
    bin.addItem(red);
    bin.addItem(green);

    expect(bin.getColor()).toBe('');
  });

  it('should return the base color if it has no items', function() {
    var bin = new ColorBin('#ff00ff');
    bin.setColorFunction(function(item) {
      return (
        /** @type {string|undefined} */ osFeature.getColor(/** @type {!olFeature} */ (item))
      );
    });
    expect(bin.getColor()).toBe('#ff00ff');
  });
});
