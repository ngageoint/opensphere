goog.declareModuleId('plugin.file.kml.model');

import Point from 'ol/src/geom/Point.js';
import AltitudeMode from '../../../os/webgl/altitudemode.js';



/**
 * @typedef {{
 *   collada: string,
 *   images: !Object<string, string>,
 *
 *   heading: number,
 *   tilt: number,
 *   roll: number,
 *
 *   scaleX: number,
 *   scaleY: number,
 *   scaleZ: number
 * }}
 */
export let KMLModel;

/**
 * Field used to store Collada models on features.
 * @type {string}
 */
export const MODEL_FIELD = 'Model';


/**
 * Get a default KML model object.
 * @return {KMLModel}
 */
const getDefaultModel = () => ({
  collada: '',
  images: {},

  heading: 0,
  tilt: 0,
  roll: 0,

  scaleX: 1,
  scaleY: 1,
  scaleZ: 1
});


/**
 * Parses a KML model element that may be contained in a placemark element.
 *
 * @param {Element} el A placemark xml element.
 * @param {Object} object The object to add the model information to.
 */
export const parseModel = function(el, object) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    if (el.children[i].localName == 'Model') {
      const modelElement = el.children[i];
      const modelObject = getDefaultModel();
      for (let j = 0; j < modelElement.children.length; j++) {
        if (modelElement.children[j].localName == 'Location') {
          parseLocation(modelElement.children[j], object);
        } else if (modelElement.children[j].localName == 'Orientation') {
          parseOrientation(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'Scale') {
          parseScale(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'altitudeMode') {
          parseAltMode(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'Link') {
          parseLink(el, modelElement.children[j], modelObject);
        }
      }

      const keys = Object.keys(el.assetMap);
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        if (!key.endsWith('.dae')) {
          modelObject.images[key] = el.assetMap[key];
        }
      }

      object[MODEL_FIELD] = modelObject;
      break;
    }
  }
};


/**
 * Parses the alitude mode element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {KMLModel} object The object to add the link information to.
 */
const parseAltMode = function(el, object) {
  const altModeText = el.textContent;

  let altMode = AltitudeMode.CLAMP_TO_GROUND;
  if (altModeText == 'relativeToGround') {
    altMode = AltitudeMode.RELATIVE_TO_GROUND;
  }

  object['altitudeMode'] = altMode;
};


/**
 * Parses the link element of the model.
 *
 * @param {Element} placemark The placemark element
 * @param {Element} el A model xml element.
 * @param {KMLModel} object The object to add the link information to.
 */
const parseLink = function(placemark, el, object) {
  const colladaFileName = el.children[0].textContent;
  const colladaData = placemark.assetMap[colladaFileName];
  object.collada = colladaData;
};


/**
 * Parses the location element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {Object} object The object to add the point geometry to.
 */
const parseLocation = function(el, object) {
  let lat;
  let lon;
  let alt;

  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].localName == 'longitude') {
      lon = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'latitude') {
      lat = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'altitude') {
      alt = parseFloat(el.children[i].textContent);
    }
  }

  object['geometry'] = new Point([lon, lat, alt]);
};


/**
 * Parses the orientation element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {KMLModel} object The object to add the orientation information to.
 */
const parseOrientation = function(el, object) {
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].localName == 'heading') {
      object['heading'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'tilt') {
      object['tilt'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'roll') {
      object['roll'] = parseFloat(el.children[i].textContent);
    }
  }
};


/**
 * Parses the scale element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {KMLModel} object The object to add the scale information to.
 */
const parseScale = function(el, object) {
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].localName == 'x') {
      object['scaleX'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'y') {
      object['scaleY'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'z') {
      object['scaleZ'] = parseFloat(el.children[i].textContent);
    }
  }
};
