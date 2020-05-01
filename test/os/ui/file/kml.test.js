goog.require('os.ui.file.kml');


describe('os.ui.file.kml', function() {
  afterEach(() => {
    // return this value to the default
    os.ui.file.kml.isGoogleMapsAccessible = true;
  });

  it('converts Google icon URLs', function() {
    expect(os.ui.file.kml.replaceGoogleUri(null)).toBe('');
    expect(os.ui.file.kml.replaceGoogleUri(undefined)).toBe('');
    expect(os.ui.file.kml.replaceGoogleUri('')).toBe('');
    expect(os.ui.file.kml.replaceGoogleUri('http://not.google.com/icon.png'))
        .toBe('http://not.google.com/icon.png');

    const original = os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_CIRCLE;
    const expected = os.ui.file.kml.ICON_PATH + os.ui.file.kml.GoogleEarthIcons.PLACEMARK_CIRCLE;
    expect(os.ui.file.kml.replaceGoogleUri(original)).toBe(expected);
    const schemeRelative = original.replace(/https?:/, '');
    expect(os.ui.file.kml.replaceGoogleUri(schemeRelative)).toBe(expected);
  });

  it('should not convert Google icon URLs which we do not have replacements for', () => {
    const icon = os.ui.file.kml.GOOGLE_EARTH_URL + '/some_unknown_image.png';
    expect(os.ui.file.kml.replaceGoogleUri(icon)).toBe(icon);
  });

  it('it should use the default icon for icons lacking replacements when maps.google.com is not available', () => {
    os.ui.file.kml.isGoogleMapsAccessible = false;
    const icon = os.ui.file.kml.GOOGLE_EARTH_URL + '/some_unknown_image.png';
    expect(os.ui.file.kml.replaceGoogleUri(icon)).toBe(os.ui.file.kml.DEFAULT_ICON_PATH);
  });

  it('provides a default icon', function() {
    var icon = os.ui.file.kml.getDefaultIcon();
    expect(icon).toBeDefined();
    expect(icon.path).toBe(os.ui.file.kml.DEFAULT_ICON_PATH);
  });
});
