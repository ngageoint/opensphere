goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.data.histo.ColorBin');


describe('os.data.histo.ColorBin', function() {
  var red = new ol.Feature();
  red.set(os.data.RecordField.COLOR, '#f00');
  var green = new ol.Feature();
  green.set(os.data.RecordField.COLOR, '#0f0');
  var blue = new ol.Feature();
  blue.set(os.data.RecordField.COLOR, '#00f');

  it('should add items and increment the color counts', function() {
    var bin = new os.data.histo.ColorBin('#ff00ff');

    bin.addItem(red);
    expect(bin.getColorCounts()['#ff0000']).toBe(1);

    bin.addItem(green);
    expect(bin.getColorCounts()['#00ff00']).toBe(1);

    bin.addItem(blue);
    expect(bin.getColorCounts()['#0000ff']).toBe(1);
  });

  it('should add items and decrement the color counts', function() {
    var bin = new os.data.histo.ColorBin('#ff00ff');
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
    var bin = new os.data.histo.ColorBin('#ff00ff');
    bin.addItem(red);

    expect(bin.getColor()).toBe('#ff0000');
  });

  it('should NOT return a color if not all items are the same color', function() {
    var bin = new os.data.histo.ColorBin('#ff00ff');
    bin.addItem(red);
    bin.addItem(green);

    expect(bin.getColor()).toBe('');
  });

  it('should return the base color if it has no items', function() {
    var bin = new os.data.histo.ColorBin('#ff00ff');
    expect(bin.getColor()).toBe('#ff00ff');
  });
});
