/**
 * @fileoverview KML Tour parser.
 * @suppress {accessControls}
 */
goog.declareModuleId('plugin.file.kml.tour.parseTour');

import Tour from './tour.js';
import TourControl from './tourcontrol.js';
import FlyTo from './tourflyto.js';
import SoundCue from './toursoundcue.js';
import Wait from './tourwait.js';

const KML = goog.require('ol.format.KML');
const XSD = goog.require('ol.format.XSD');
const xml = goog.require('ol.xml');
const FlightMode = goog.require('os.map.FlightMode');

/**
 * Parses a KML Tour element into a tour object.
 *
 * @param {Element} el The XML element.
 * @return {Tour|undefined} The tour.
 */
const parseTour = (el) => {
  if (!el || el.localName !== 'Tour') {
    return undefined;
  }

  return xml.pushParseAndPop(new Tour(), TOUR_PARSERS, el, []);
};


/**
 * Support both KML 2.3 and `gx:` tour elements.
 * @type {Array<string>}
 */
const tourNamespaceUris = KML.NAMESPACE_URIS_.concat(KML.GX_NAMESPACE_URIS_);


/**
 * Parses a tour playlist.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
const parsePlaylist = function(node, objectStack) {
  var playlist = xml.pushParseAndPop([], PLAYLIST_PARSERS, node, objectStack);
  if (playlist) {
    var tour = objectStack[objectStack.length - 1];
    if (tour instanceof Tour) {
      tour.setPlaylist(playlist);
    }
  }
};


/**
 * Parses a tour FlyTo element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {FlyTo|undefined}
 */
const parseFlyTo = function(node, objectStack) {
  var flyTo;
  var flyToProps = xml.pushParseAndPop({}, FLYTO_PARSERS, node, objectStack);
  if (flyToProps) {
    var viewProps = /** @type {Object|undefined} */ (flyToProps['Camera']);
    if (!viewProps) {
      viewProps = /** @type {Object|undefined} */ (flyToProps['LookAt']) || {};
    }

    // convert to milliseconds, defaulting to 0 (to let the FlyTo object determine the default)
    var duration = /** @type {number} */ (flyToProps['duration'] || 0) * 1000;

    // only 'smooth' and 'bounce' are allowed values, default to 'bounce'
    var flightMode = flyToProps['flyToMode'] === 'smooth' ? FlightMode.SMOOTH : FlightMode.BOUNCE;

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
    var pitch = /** @type {number|undefined} */ (viewProps['tilt'] || 0);

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

    flyTo = new FlyTo(options);
  }

  return flyTo;
};


/**
 * Parses a tour Camera element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined}
 */
const parseCamera = function(node, objectStack) {
  return xml.pushParseAndPop({}, CAMERA_PARSERS, node, objectStack);
};


/**
 * Parses a tour LookAt element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined}
 */
const parseLookAt = function(node, objectStack) {
  return xml.pushParseAndPop({}, LOOKAT_PARSERS, node, objectStack);
};


/**
 * Parses a tour SoundCue element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {SoundCue|undefined}
 */
const parseSoundCue = function(node, objectStack) {
  var soundCue;
  var soundCueOptions = xml.pushParseAndPop({}, SOUNDCUE_PARSERS, node, objectStack);
  if (soundCueOptions['href']) {
    var href = /** @type {string} */ (soundCueOptions['href']);
    var delayedStart = /** @type {number|undefined} */ (soundCueOptions['delayedStart'] || 0) * 1000;
    soundCue = new SoundCue(href, delayedStart);
  }
  return soundCue;
};


/**
 * Parses a tour TourControl element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {TourControl|undefined}
 */
const parseTourControl = function(node, objectStack) {
  var tourControl;
  var tour = objectStack.length > 1 ? objectStack[objectStack.length - 2] : undefined;
  if (tour instanceof Tour) {
    tourControl = new TourControl(tour);
  }
  return tourControl;
};


/**
 * Parses a tour Wait element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Wait|undefined}
 */
const parseWait = function(node, objectStack) {
  var waitOptions = xml.pushParseAndPop({}, WAIT_PARSERS, node, objectStack);

  // KML duration is in seconds, so convert to milliseconds
  var duration = (waitOptions.duration || 0) * 1000;
  return new Wait(duration);
};


/**
 * Parsers for a KML Tour element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const TOUR_PARSERS = xml.makeStructureNS(
    tourNamespaceUris, {
      'Playlist': parsePlaylist,
      'description': xml.makeObjectPropertySetter(XSD.readString),
      'name': xml.makeObjectPropertySetter(XSD.readString)
    });


/**
 * Parsers for a KML Playlist element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const PLAYLIST_PARSERS = xml.makeStructureNS(
    tourNamespaceUris, {
      'FlyTo': xml.makeArrayPusher(parseFlyTo),
      'SoundCue': xml.makeArrayPusher(parseSoundCue),
      'TourControl': xml.makeArrayPusher(parseTourControl),
      'Wait': xml.makeArrayPusher(parseWait)
    });


/**
 * Parsers for a KML FlyTo element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const FLYTO_PARSERS = xml.makeStructureNS(
    tourNamespaceUris, {
      'duration': xml.makeObjectPropertySetter(XSD.readDecimal),
      'flyToMode': xml.makeObjectPropertySetter(XSD.readString),
      'Camera': xml.makeObjectPropertySetter(parseCamera),
      'LookAt': xml.makeObjectPropertySetter(parseLookAt)
    });


/**
 * Parsers for a KML Camera element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const CAMERA_PARSERS = xml.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'longitude': xml.makeObjectPropertySetter(XSD.readDecimal),
      'latitude': xml.makeObjectPropertySetter(XSD.readDecimal),
      'altitude': xml.makeObjectPropertySetter(XSD.readDecimal),
      'heading': xml.makeObjectPropertySetter(XSD.readDecimal),
      'tilt': xml.makeObjectPropertySetter(XSD.readDecimal),
      'roll': xml.makeObjectPropertySetter(XSD.readDecimal),
      'altitudeMode': xml.makeObjectPropertySetter(XSD.readString)
    });


/**
 * Parsers for a KML Camera element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const LOOKAT_PARSERS = xml.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'longitude': xml.makeObjectPropertySetter(XSD.readDecimal),
      'latitude': xml.makeObjectPropertySetter(XSD.readDecimal),
      'altitude': xml.makeObjectPropertySetter(XSD.readDecimal),
      'heading': xml.makeObjectPropertySetter(XSD.readDecimal),
      'tilt': xml.makeObjectPropertySetter(XSD.readDecimal),
      'range': xml.makeObjectPropertySetter(XSD.readDecimal),
      'altitudeMode': xml.makeObjectPropertySetter(XSD.readString)
    });


/**
 * Parsers for a KML SoundCue element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const SOUNDCUE_PARSERS = xml.makeStructureNS(
    tourNamespaceUris, {
      'href': xml.makeObjectPropertySetter(XSD.readString),
      'delayedStart': xml.makeObjectPropertySetter(XSD.readDecimal)
    });


/**
 * Parsers for a KML Wait element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const WAIT_PARSERS = xml.makeStructureNS(
    tourNamespaceUris, {
      'duration': xml.makeObjectPropertySetter(XSD.readDecimal)
    });

export default parseTour;
