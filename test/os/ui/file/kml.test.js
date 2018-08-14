goog.require('os.ui.file.kml');


describe('os.ui.file.kml', function() {
  it('converts Google icon URLs', function() {
    expect(os.ui.file.kml.replaceGoogleUri(null)).toBe('');
    expect(os.ui.file.kml.replaceGoogleUri(undefined)).toBe('');
    expect(os.ui.file.kml.replaceGoogleUri('')).toBe('');
    expect(os.ui.file.kml.replaceGoogleUri('http://not.google.com/icon.png'))
        .toBe('http://not.google.com/icon.png');

    var original = os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_CIRCLE;
    var expected = os.ui.file.kml.ICON_PATH + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_CIRCLE;
    expect(os.ui.file.kml.replaceGoogleUri(original)).toBe(expected);
  });

  it('provides a default icon', function() {
    var icon = os.ui.file.kml.getDefaultIcon();
    expect(icon).toBeDefined();
    expect(icon.path).toBe(os.ui.file.kml.DEFAULT_ICON_PATH);
  });
});
