goog.provide('os.control');

goog.require('ol.Collection');
goog.require('ol.control');
goog.require('os.control.AlertPopup');
goog.require('os.control.Attribution');
goog.require('os.control.MapMode');
goog.require('os.control.Rotate');
goog.require('os.control.ScaleLine');
goog.require('os.control.Zoom');
goog.require('os.control.ZoomLevel');
goog.require('os.ol.control.MousePosition');


/**
 * @return {ol.Collection}
 */
os.control.getControls = function() {
  var controls = [];

  var scaleLine_ = new os.control.ScaleLine({
    target: document.getElementById('scale-line')
  });
  controls.push(scaleLine_);

  var mousePositionEle = document.getElementById('mouse-position');
  if (mousePositionEle) {
    var mousePositionControl = new os.ol.control.MousePosition({
      projection: os.proj.EPSG4326,
      className: 'mouse-position',
      target: mousePositionEle,
      undefinedHTML: '&nbsp;',
      useSettings: true
    });

    controls.push(mousePositionControl);
  }

  var zoomLevel = new os.control.ZoomLevel({
    target: document.getElementById('zoom-level')
  });
  controls.push(zoomLevel);

  var zoomCtrl = new os.control.Zoom();
  controls.push(zoomCtrl);

  var rotate = new os.control.Rotate();
  controls.push(rotate);

  var mapMode = new os.control.MapMode();
  controls.push(mapMode);

  var alerts = new os.control.AlertPopup();
  controls.push(alerts);

  var attributions = new os.control.Attribution(/** @type {olx.control.AttributionOptions} */ ({
    collapsible: false
  }));

  controls.push(attributions);

  return new ol.Collection(controls);
};
