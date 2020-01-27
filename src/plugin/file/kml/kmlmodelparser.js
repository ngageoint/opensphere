goog.provide('plugin.file.kml.KMLModelParser');

/**
 * Parses a KML model element that may be contained in a placemark element.
 *
 * @param {Element} el A placemark xml element.
 * @param {Object} object The object to add the model information to.
 */
plugin.file.kml.parseModel = function(el, object) {
  for (var i = el.children.length - 1; i >= 0; i--) {
    if (el.children[i].localName == 'Model') {
      var modelElement = el.children[i];
      var modelObject = {};
      for (var j = 0; j < modelElement.children.length; j++) {
        if (modelElement.children[j].localName == 'Location') {
          plugin.file.kml.parseLocation(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'Orientation') {
          plugin.file.kml.parseOrientation(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'Scale') {
          plugin.file.kml.parseScale(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'altitudeMode') {
          this.parseAltMode(modelElement.children[j], modelObject);
        } else if (modelElement.children[j].localName == 'Link') {
          this.parseLink(el, modelElement.children[j], modelObject);
        }
      }

      const keys = Object.keys(el.assetMap);
      var imagesObject = {};
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (!key.endsWith('.dae')) {
          imagesObject[key] = el.assetMap[key];
        }
      }

      modelObject['Images'] = imagesObject;
      object['Model'] = modelObject;
      break;
    }
  }
};

/**
 * Parses the alitude mode element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {Object} object The object to add the link information to.
 */
plugin.file.kml.parseAltMode = function(el, object) {
  var altModeText = el.textContent;

  var altMode = os.webgl.AltitudeMode.CLAMP_TO_GROUND;
  if (altModeText == 'relativeToGround') {
    altMode = os.webgl.AltitudeMode.RELATIVE_TO_GROUND;
  }

  object['altitudeMode'] = altMode;
};

/**
 * Parses the link element of the model.
 *
 * @param {Element} placemark The placemark element
 * @param {Element} el A model xml element.
 * @param {Object} object The object to add the link information to.
 */
plugin.file.kml.parseLink = function(placemark, el, object) {
  var colladaFileName = el.children[0].textContent;
  var colladaData = placemark.assetMap[colladaFileName];
  object['collada'] = colladaData;
};

/**
 * Parses the location element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {Object} object The object to add the location information to.
 */
plugin.file.kml.parseLocation = function(el, object) {
  for (var i = 0; i < el.children.length; i++) {
    if (el.children[i].localName == 'longitude') {
      object['longitude'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'latitude') {
      object['latitude'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'altitude') {
      object['altitude'] = parseFloat(el.children[i].textContent);
    }
  }
};

/**
 * Parses the orientation element of the model.
 *
 * @param {Element} el A model xml element.
 * @param {Object} object The object to add the orientation information to.
 */
plugin.file.kml.parseOrientation = function(el, object) {
  for (var i = 0; i < el.children.length; i++) {
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
 * @param {Object} object The object to add the scale information to.
 */
plugin.file.kml.parseScale = function(el, object) {
  for (var i = 0; i < el.children.length; i++) {
    if (el.children[i].localName == 'x') {
      object['scaleX'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'y') {
      object['scaleY'] = parseFloat(el.children[i].textContent);
    } else if (el.children[i].localName == 'z') {
      object['scaleZ'] = parseFloat(el.children[i].textContent);
    }
  }
};
