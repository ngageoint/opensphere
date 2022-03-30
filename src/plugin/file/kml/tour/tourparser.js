/**
 * @fileoverview KML Tour parser.
 * @suppress {accessControls}
 */
goog.declareModuleId('plugin.file.kml.tour.parseTour');

import {readDecimal, readString} from 'ol/src/format/xsd.js';
import {makeArrayPusher, makeObjectPropertySetter, makeStructureNS, pushParseAndPop} from 'ol/src/xml.js';
import FlightMode from '../../../../os/map/flightmode.js';
import {NAMESPACE_URIS, GX_NAMESPACE_URIS} from '../../../../os/ol/format/KML.js';
import Tour from './tour.js';
import TourControl from './tourcontrol.js';
import FlyTo from './tourflyto.js';
import SoundCue from './toursoundcue.js';
import Wait from './tourwait.js';



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

  return pushParseAndPop(new Tour(), TOUR_PARSERS, el, []);
};


/**
 * Support both KML 2.3 and `gx:` tour elements.
 * @type {Array<string>}
 */
const tourNamespaceUris = NAMESPACE_URIS.concat(GX_NAMESPACE_URIS);


/**
 * Parses a tour playlist.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
const parsePlaylist = function(node, objectStack) {
  var playlist = pushParseAndPop([], PLAYLIST_PARSERS, node, objectStack);
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
  var flyToProps = pushParseAndPop({}, FLYTO_PARSERS, node, objectStack);
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
  return pushParseAndPop({}, CAMERA_PARSERS, node, objectStack);
};


/**
 * Parses a tour LookAt element.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined}
 */
const parseLookAt = function(node, objectStack) {
  return pushParseAndPop({}, LOOKAT_PARSERS, node, objectStack);
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
  var soundCueOptions = pushParseAndPop({}, SOUNDCUE_PARSERS, node, objectStack);
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
  var waitOptions = pushParseAndPop({}, WAIT_PARSERS, node, objectStack);

  // KML duration is in seconds, so convert to milliseconds
  var duration = (waitOptions.duration || 0) * 1000;
  return new Wait(duration);
};


/**
 * Parsers for a KML Tour element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const TOUR_PARSERS = makeStructureNS(
    tourNamespaceUris, {
      'Playlist': parsePlaylist,
      'description': makeObjectPropertySetter(readString),
      'name': makeObjectPropertySetter(readString)
    });


/**
 * Parsers for a KML Playlist element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const PLAYLIST_PARSERS = makeStructureNS(
    tourNamespaceUris, {
      'FlyTo': makeArrayPusher(parseFlyTo),
      'SoundCue': makeArrayPusher(parseSoundCue),
      'TourControl': makeArrayPusher(parseTourControl),
      'Wait': makeArrayPusher(parseWait)
    });


/**
 * Parsers for a KML FlyTo element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const FLYTO_PARSERS = makeStructureNS(
    tourNamespaceUris, {
      'duration': makeObjectPropertySetter(readDecimal),
      'flyToMode': makeObjectPropertySetter(readString),
      'Camera': makeObjectPropertySetter(parseCamera),
      'LookAt': makeObjectPropertySetter(parseLookAt)
    });


/**
 * Parsers for a KML Camera element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const CAMERA_PARSERS = makeStructureNS(
    NAMESPACE_URIS, {
      'longitude': makeObjectPropertySetter(readDecimal),
      'latitude': makeObjectPropertySetter(readDecimal),
      'altitude': makeObjectPropertySetter(readDecimal),
      'heading': makeObjectPropertySetter(readDecimal),
      'tilt': makeObjectPropertySetter(readDecimal),
      'roll': makeObjectPropertySetter(readDecimal),
      'altitudeMode': makeObjectPropertySetter(readString)
    });


/**
 * Parsers for a KML Camera element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const LOOKAT_PARSERS = makeStructureNS(
    NAMESPACE_URIS, {
      'longitude': makeObjectPropertySetter(readDecimal),
      'latitude': makeObjectPropertySetter(readDecimal),
      'altitude': makeObjectPropertySetter(readDecimal),
      'heading': makeObjectPropertySetter(readDecimal),
      'tilt': makeObjectPropertySetter(readDecimal),
      'range': makeObjectPropertySetter(readDecimal),
      'altitudeMode': makeObjectPropertySetter(readString)
    });


/**
 * Parsers for a KML SoundCue element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const SOUNDCUE_PARSERS = makeStructureNS(
    tourNamespaceUris, {
      'href': makeObjectPropertySetter(readString),
      'delayedStart': makeObjectPropertySetter(readDecimal)
    });


/**
 * Parsers for a KML Wait element.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
const WAIT_PARSERS = makeStructureNS(
    tourNamespaceUris, {
      'duration': makeObjectPropertySetter(readDecimal)
    });

export default parseTour;
