goog.require('os.map.FlightMode');
goog.require('plugin.file.kml.tour.FlyTo');
goog.require('plugin.file.kml.tour.SoundCue');
goog.require('plugin.file.kml.tour.Tour');
goog.require('plugin.file.kml.tour.TourControl');
goog.require('plugin.file.kml.tour.Wait');
goog.require('plugin.file.kml.tour.parseTour');

import {parse} from 'ol/src/xml.js';

describe('plugin.file.kml.tour.parseTour', function() {
  const {default: FlightMode} = goog.module.get('os.map.FlightMode');
  const {default: FlyTo} = goog.module.get('plugin.file.kml.tour.FlyTo');
  const {default: SoundCue} = goog.module.get('plugin.file.kml.tour.SoundCue');
  const {default: TourControl} = goog.module.get('plugin.file.kml.tour.TourControl');
  const {default: Wait} = goog.module.get('plugin.file.kml.tour.Wait');
  const {default: parseTour} = goog.module.get('plugin.file.kml.tour.parseTour');
  // match opening/closing tags for a KML tour element, with a trailing space (has attributes) or GT (no attributes)
  var tourElRegexp = /(<\/?)(Tour|Playlist|FlyTo|SoundCue|TourControl|Wait|delayedStart|duration|flyToMode)([ >])/g;

  /**
   * Prefix KML tour element names.
   * @param {string} text The KML text.
   * @param {string} namespace The namespace.
   * @return {string} The replaced text.
   */
  var replaceText = function(text, namespace) {
    return namespace ? text.replace(tourElRegexp, '$1' + 'gx:' + '$2>') : text;
  };

  /**
   * Parse KML tour text and return the root node.
   * @param {string} text The KML tour text.
   * @param {string} namespace The namespace.
   * @return {Element} The root Tour element.
   */
  var getTourNode = function(text, namespace) {
    var node = parse(replaceText(text, namespace));
    return node.firstElementChild;
  };

  var runTests = function(namespace) {
    describe(namespace + 'Tour', function() {
      it('parses a ' + namespace + 'Tour element', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist></Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        expect(tour).toBeDefined();
        expect(tour.name).toBe('Test Tour');
        expect(tour.description).toBe('Test Tour Description');
        expect(tour.getPlaylist().length).toBe(0);
      });

      it('parses a ' + namespace + 'FlyTo element without duration or flyToMode', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <FlyTo></FlyTo>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        var flyTo = tour.getPlaylist()[0];
        expect(flyTo instanceof FlyTo).toBe(true);
        expect(flyTo.duration_).toBe(FlyTo.DEFAULT_DURATION);
        expect(flyTo.options_.flightMode).toBe(FlightMode.BOUNCE);
      });

      it('parses a ' + namespace + 'FlyTo element with duration', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <FlyTo>' +
            '      <duration>10</duration>' +
            '    </FlyTo>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        var flyTo = tour.getPlaylist()[0];
        expect(flyTo instanceof FlyTo).toBe(true);
        expect(flyTo.duration_).toBe(10000);
      });

      it('parses a ' + namespace + 'FlyTo element with flyToMode', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <FlyTo>' +
            '      <flyToMode>smooth</flyToMode>' +
            '    </FlyTo>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        var flyTo = tour.getPlaylist()[0];
        expect(flyTo instanceof FlyTo).toBe(true);
        expect(flyTo.options_.flightMode).toBe(FlightMode.SMOOTH);
      });

      it('parses a ' + namespace + 'FlyTo element with invalid flyToMode', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <FlyTo>' +
            '      <flyToMode>teleport</flyToMode>' +
            '    </FlyTo>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        var flyTo = tour.getPlaylist()[0];
        expect(flyTo instanceof FlyTo).toBe(true);
        expect(flyTo.options_.flightMode).toBe(FlightMode.BOUNCE);
      });

      it('parses a ' + namespace + 'FlyTo element with a Camera definition', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <FlyTo>' +
            '      <Camera>' +
            '        <longitude>123.45</longitude>' +
            '        <latitude>-67.89</latitude>' +
            '        <altitude>12345</altitude>' +
            '        <heading>-1.234</heading>' +
            '        <tilt>42</tilt>' +
            '        <altitudeMode>absolute</altitudeMode>' +
            '      </Camera>' +
            '    </FlyTo>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        expect(tour).toBeDefined();

        var playlist = tour.getPlaylist();
        expect(playlist.length).toBe(1);

        var flyTo = playlist[0];
        expect(flyTo instanceof FlyTo).toBe(true);
        expect(flyTo.options_.center[0]).toBe(123.45);
        expect(flyTo.options_.center[1]).toBe(-67.89);
        expect(flyTo.options_.altitude).toBe(12345);
        expect(flyTo.options_.heading).toBe(-1.234);

        // tilt converted to Cesium pitch
        expect(flyTo.options_.tilt).toBeUndefined();
        expect(flyTo.options_.pitch).toBe(42);
      });

      it('parses a ' + namespace + 'FlyTo element with a LookAt definition', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <FlyTo>' +
            '      <duration>10</duration>' +
            '      <LookAt>' +
            '        <longitude>123.45</longitude>' +
            '        <latitude>-67.89</latitude>' +
            '        <altitude>150</altitude>' +
            '        <heading>-1.234</heading>' +
            '        <tilt>42</tilt>' +
            '        <range>12345</range>' +
            '        <altitudeMode>absolute</altitudeMode>' +
            '      </LookAt>' +
            '    </FlyTo>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        expect(tour).toBeDefined();

        var playlist = tour.getPlaylist();
        expect(playlist.length).toBe(1);

        var flyTo = playlist[0];
        expect(flyTo instanceof FlyTo).toBe(true);
        expect(flyTo.options_.center[0]).toBe(123.45);
        expect(flyTo.options_.center[1]).toBe(-67.89);
        expect(flyTo.options_.altitude).toBe(150);
        expect(flyTo.options_.heading).toBe(-1.234);
        expect(flyTo.options_.range).toBe(12345);

        // tilt converted to Cesium pitch
        expect(flyTo.options_.tilt).toBeUndefined();
        expect(flyTo.options_.pitch).toBe(42);
      });

      it('parses a ' + namespace + 'SoundCue element', function() {
        var href = 'https://test.com/test.mp3';
        var delayedStart = 10;
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <SoundCue>' +
            '      <href>' + href + '</href>' +
            '      <delayedStart>' + delayedStart + '</delayedStart>' +
            '    </SoundCue>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        expect(tour).toBeDefined();

        var playlist = tour.getPlaylist();
        expect(playlist.length).toBe(1);
        expect(playlist[0] instanceof SoundCue).toBe(true);
        expect(playlist[0].href_).toBe(href);
        expect(playlist[0].duration_).toBe(delayedStart * 1000);
      });

      it('parses a ' + namespace + 'TourControl element', function() {
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <TourControl></TourControl>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        expect(tour).toBeDefined();

        var playlist = tour.getPlaylist();
        expect(playlist.length).toBe(1);
        expect(playlist[0] instanceof TourControl).toBe(true);
        expect(playlist[0].tour_).toBe(tour);
      });

      it('parses a ' + namespace + 'Wait element', function() {
        var duration = 10;
        var text =
            '<Tour>' +
            '  <name>Test Tour</name>' +
            '  <description>Test Tour Description</description>' +
            '  <Playlist>' +
            '    <Wait>' +
            '      <duration>' + duration + '</duration>' +
            '    </Wait>' +
            '  </Playlist>' +
            '</Tour>';

        var tour = parseTour(getTourNode(text));
        expect(tour).toBeDefined();

        var playlist = tour.getPlaylist();
        expect(playlist.length).toBe(1);
        expect(playlist[0] instanceof Wait).toBe(true);
        expect(playlist[0].duration_).toBe(duration * 1000);
      });
    });
  };

  // KML 2.2 with gx extension
  runTests('gx:');

  // KML 2.3
  runTests('');
});
