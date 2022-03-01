goog.require('os.ui.file.kml');


describe('os.ui.file.kml', function() {
  const kml = goog.module.get('os.ui.file.kml');

  afterEach(() => {
    // return this value to the default
    kml.setGoogleMapsAccessible(true);
  });

  it('converts Google icon URLs', function() {
    expect(kml.replaceGoogleUri(null)).toBe('');
    expect(kml.replaceGoogleUri(undefined)).toBe('');
    expect(kml.replaceGoogleUri('')).toBe('');
    expect(kml.replaceGoogleUri('http://not.google.com/icon.png'))
        .toBe('http://not.google.com/icon.png');

    const original = kml.GOOGLE_EARTH_URL + kml.GoogleEarthIcons.PLACEMARK_CIRCLE;
    const expected = kml.ICON_PATH + kml.GoogleEarthIcons.PLACEMARK_CIRCLE;
    expect(kml.replaceGoogleUri(original)).toBe(expected);
    const schemeRelative = original.replace(/https?:/, '');
    expect(kml.replaceGoogleUri(schemeRelative)).toBe(expected);
  });

  it('should not convert Google icon URLs which we do not have replacements for', () => {
    const icon = kml.GOOGLE_EARTH_URL + '/some_unknown_image.png';
    expect(kml.replaceGoogleUri(icon)).toBe(icon);
  });

  it('it should use the default icon for icons lacking replacements when maps.google.com is not available', () => {
    kml.setGoogleMapsAccessible(false);
    const icon = kml.GOOGLE_EARTH_URL + '/some_unknown_image.png';
    expect(kml.replaceGoogleUri(icon)).toBe(kml.DEFAULT_ICON_PATH);
  });

  it('provides a default icon', function() {
    var icon = kml.getDefaultIcon();
    expect(icon).toBeDefined();
    expect(icon.path).toBe(kml.DEFAULT_ICON_PATH);
  });
});
