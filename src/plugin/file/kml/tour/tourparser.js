/**
 * @fileoverview KML Tour parser.
 * @suppress {accessControls}
 */
goog.provide('plugin.file.kml.tour.parseTour');

goog.require('ol.format.KML');
goog.require('ol.format.XSD');
goog.require('ol.xml');
goog.require('plugin.file.kml.tour.FlyTo');
goog.require('plugin.file.kml.tour.SoundCue');
goog.require('plugin.file.kml.tour.Tour');
goog.require('plugin.file.kml.tour.TourControl');
goog.require('plugin.file.kml.tour.Wait');


/**
 * Parses a KML Tour element into a tour object.
 * @param {Element} el The XML element.
 * @return {plugin.file.kml.tour.Tour|undefined} The tour.
 */
plugin.file.kml.tour.parseTour = function(el) {
  if (!el || el.localName !== 'Tour') {
    return undefined;
  }

  return ol.xml.pushParseAndPop(new plugin.file.kml.tour.Tour(), plugin.file.kml.tour.TOUR_PARSERS_, el, []);
};


/**
 * Support both KML 2.3 and `gx:` tour elements.
 * @type {Array<string>}
 * @private
 * @const
 */
plugin.file.kml.tour.NAMESPACE_URIS_ = ol.format.KML.NAMESPACE_URIS_.concat(ol.format.KML.GX_NAMESPACE_URIS_);


/**
 * Parses a tour playlist.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.tour.parsePlaylist_ = function(node, objectStack) {
  var playlist = ol.xml.pushParseAndPop([], plugin.file.kml.tour.PLAYLIST_PARSERS_, node, objectStack);
  if (playlist) {
    var tour = objectStack[objectStack.length - 1];
    if (tour instanceof plugin.file.kml.tour.Tour) {
      tour.setPlaylist(playlist);
    }
  }
};


/**
 * Parses a tour FlyTo element.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {plugin.file.kml.tour.FlyTo|undefined}
 * @private
 */
plugin.file.kml.tour.parseFlyTo_ = function(node, objectStack) {
  var flyTo;
  var flyToProps = ol.xml.pushParseAndPop({}, plugin.file.kml.tour.FLYTO_PARSERS_, node, objectStack);
  if (flyToProps) {
    var viewProps = /** @type {Object|undefined} */ (flyToProps['Camera']);
    if (!viewProps) {
      viewProps = /** @type {Object|undefined} */ (flyToProps['LookAt']) || {};
    }

    // convert to milliseconds, defaulting to 0 (to let the FlyTo object determine the default)
    var duration = /** @type {number} */ (flyToProps['duration'] || 0) * 1000;

    // only 'smooth' and 'bounce' are allowed values, default to 'bounce'
    var flightMode = flyToProps['flyToMode'] === 'smooth' ? os.FlightMode.SMOOTH : os.FlightMode.BOUNCE;

    // if center isn't defined, the flight should still adjust heading, pitch, etc
    var center;
    if (viewProps['longitude'] && viewProps['latitude']) {
      center = [
        /** @type {number} */ (viewProps['longitude']),
        /** @type {number} */ (viewProps['latitude'])
      ];
    }

    // translate KML tilt to Cesium pitch:
    //   Cesium pitch: -90 is perpendicular to the globe, 0 is parallel.
    //   KML pitch: 0 is perpendicular to the globe, 90 is parallel.
    var pitch = /** @type {number|undefined} */ (viewProps['tilt'] || 0) - 90;

    // TODO: implement support for altitudeMode in camera fly to
    var options = /** @type {!osx.map.FlyToOptions} */ ({
      center: center,
      altitude: /** @type {number} */ (viewProps['altitude'] || 0),
      duration: duration,
      heading: /** @type {number|undefined} */ (viewProps['heading'] || undefined),
      pitch: pitch,
      range: /** @type {number|undefined} */ (viewProps['range'] || undefined),
      roll: /** @type {number|undefined} */ (viewProps['roll'] || undefined),
      flightMode: flightMode,
      positionCamera: !!flyToProps['Camera']
    });

    flyTo = new plugin.file.kml.tour.FlyTo(options);
  }

  return flyTo;
};


/**
 * Parses a tour Camera element.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined}
 * @private
 */
plugin.file.kml.tour.parseCamera_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({}, plugin.file.kml.tour.CAMERA_PARSERS_, node, objectStack);
};


/**
 * Parses a tour LookAt element.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined}
 * @private
 */
plugin.file.kml.tour.parseLookAt_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({}, plugin.file.kml.tour.LOOKAT_PARSERS_, node, objectStack);
};


/**
 * Parses a tour SoundCue element.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {plugin.file.kml.tour.SoundCue|undefined}
 * @private
 */
plugin.file.kml.tour.parseSoundCue_ = function(node, objectStack) {
  var soundCue;
  var soundCueOptions = ol.xml.pushParseAndPop({}, plugin.file.kml.tour.SOUNDCUE_PARSERS_, node, objectStack);
  if (soundCueOptions['href']) {
    var href = /** @type {string} */ (soundCueOptions['href']);
    var delayedStart = /** @type {number|undefined} */ (soundCueOptions['delayedStart'] || 0) * 1000;
    soundCue = new plugin.file.kml.tour.SoundCue(href, delayedStart);
  }
  return soundCue;
};


/**
 * Parses a tour TourControl element.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {plugin.file.kml.tour.TourControl|undefined}
 * @private
 */
plugin.file.kml.tour.parseTourControl_ = function(node, objectStack) {
  var tourControl;
  var tour = objectStack.length > 1 ? objectStack[objectStack.length - 2] : undefined;
  if (tour instanceof plugin.file.kml.tour.Tour) {
    tourControl = new plugin.file.kml.tour.TourControl(tour);
  }
  return tourControl;
};


/**
 * Parses a tour Wait element.
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {plugin.file.kml.tour.Wait|undefined}
 * @private
 */
plugin.file.kml.tour.parseWait_ = function(node, objectStack) {
  var waitOptions = ol.xml.pushParseAndPop({}, plugin.file.kml.tour.WAIT_PARSERS_, node, objectStack);

  // KML duration is in seconds, so convert to milliseconds
  var duration = (waitOptions.duration || 0) * 1000;
  return new plugin.file.kml.tour.Wait(duration);
};


/**
 * Parsers for a KML Tour element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.TOUR_PARSERS_ = ol.xml.makeStructureNS(
    plugin.file.kml.tour.NAMESPACE_URIS_, {
      'Playlist': plugin.file.kml.tour.parsePlaylist_,
      'description': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * Parsers for a KML Playlist element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.PLAYLIST_PARSERS_ = ol.xml.makeStructureNS(
    plugin.file.kml.tour.NAMESPACE_URIS_, {
      'FlyTo': ol.xml.makeArrayPusher(plugin.file.kml.tour.parseFlyTo_),
      'SoundCue': ol.xml.makeArrayPusher(plugin.file.kml.tour.parseSoundCue_),
      'TourControl': ol.xml.makeArrayPusher(plugin.file.kml.tour.parseTourControl_),
      'Wait': ol.xml.makeArrayPusher(plugin.file.kml.tour.parseWait_)
    });


/**
 * Parsers for a KML FlyTo element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.FLYTO_PARSERS_ = ol.xml.makeStructureNS(
    plugin.file.kml.tour.NAMESPACE_URIS_, {
      'duration': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'flyToMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Camera': ol.xml.makeObjectPropertySetter(plugin.file.kml.tour.parseCamera_),
      'LookAt': ol.xml.makeObjectPropertySetter(plugin.file.kml.tour.parseLookAt_)
    });


/**
 * Parsers for a KML Camera element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.CAMERA_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'longitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'latitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'altitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'heading': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'tilt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'roll': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * Parsers for a KML Camera element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.LOOKAT_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'longitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'latitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'altitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'heading': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'tilt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'range': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * Parsers for a KML SoundCue element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.SOUNDCUE_PARSERS_ = ol.xml.makeStructureNS(
    plugin.file.kml.tour.NAMESPACE_URIS_, {
      'href': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'delayedStart': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });


/**
 * Parsers for a KML Wait element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @private
 * @const
 */
plugin.file.kml.tour.WAIT_PARSERS_ = ol.xml.makeStructureNS(
    plugin.file.kml.tour.NAMESPACE_URIS_, {
      'duration': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });
