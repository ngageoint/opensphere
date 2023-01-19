goog.declareModuleId('os.annotation.FeatureAnnotation');

import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import OverlayPositioning from 'ol/src/OverlayPositioning.js';
import {getUid} from 'ol/src/util.js';

import {getMapContainer} from '../map/mapinstance.js';
import * as ui from '../ui/ui.js';
import WebGLOverlay from '../webgl/webgloverlay.js';
import AbstractAnnotation from './abstractannotation.js';
import {OPTIONS_FIELD} from './annotation.js';
import {directiveTag as annotationUi} from './featureannotationui.js';


/**
 * An annotation tied to an OpenLayers feature.
 */
export default class FeatureAnnotation extends AbstractAnnotation {
  /**
   * Constructor.
   * @param {!Feature} feature The OpenLayers feature.
   */
  constructor(feature) {
    super();

    /**
     * The overlay.
     * @type {WebGLOverlay}
     * @protected
     */
    this.overlay = null;

    /**
     * The OpenLayers feature.
     * @type {!Feature}
     * @protected
     */
    this.feature = feature;

    this.eventsKey = listen(this.feature, EventType.CHANGE, this.handleFeatureChange, this);

    this.createUI();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    unlistenByKey(this.eventsKey);
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    return /** @type {osx.annotation.Options|undefined} */ (this.feature.get(OPTIONS_FIELD));
  }

  /**
   * @inheritDoc
   */
  setOptions(options) {
    this.feature.set(OPTIONS_FIELD, options);
  }

  /**
   * @inheritDoc
   */
  setVisibleInternal() {
    if (this.overlay && this.feature) {
      var options = this.getOptions();

      // Only show when both the feature and the annotation config flags are true.
      // Note: the overlay position is the only good way to control the visibility externally. If you try to call
      // the protected setVisible function on the overlay, much pain will be in your future.
      var showOverlay = this.visible && options.show;
      var position = options.position;
      this.overlay.setPosition(showOverlay ? position : null);
    }
  }

  /**
   * @inheritDoc
   */
  createUI() {
    this.options = this.getOptions();

    if (this.overlay || !this.options) {
      // don't create the overlay if it already exists or options are missing
      return;
    }

    if (!this.options.position) {
      var geometry = this.feature.getGeometry();
      var coordinate = geometry instanceof SimpleGeometry ? geometry.getFirstCoordinate() : undefined;
      this.options.position = coordinate;
    }

    // don't initialize with a position value as this seems to cause the overlay to jiggle on show/hide
    this.overlay = new WebGLOverlay({
      id: getUid(this.feature),
      offset: this.options.offset,
      positioning: OverlayPositioning.CENTER_CENTER
    });

    // create an Angular scope for the annotation UI
    var compile = /** @type {!angular.$compile} */ (ui.injector.get('$compile'));
    this.scope = /** @type {!angular.Scope} */ (ui.injector.get('$rootScope').$new());

    Object.assign(this.scope, {
      'feature': this.feature,
      'overlay': this.overlay
    });

    // compile the template and assign the element to the overlay
    var template = `<${annotationUi} feature="feature" overlay="overlay"></${annotationUi}>`;
    this.element = /** @type {Element} */ (compile(template)(this.scope)[0]);
    this.overlay.setElement(this.element);

    // add the overlay to the map
    var map = getMapContainer().getMap();
    if (map) {
      map.addOverlay(this.overlay);
    }

    this.setVisibleInternal();
  }

  /**
   * @inheritDoc
   */
  disposeUI() {
    if (this.overlay) {
      // remove the overlay from the map
      var map = getMapContainer().getMap();
      if (map) {
        map.removeOverlay(this.overlay);
      }

      // dispose of the overlay
      this.overlay.dispose();
      this.overlay = null;
    }

    // destroy the scope
    if (this.scope) {
      this.scope.$destroy();
      this.scope = null;
    }

    this.element = null;
  }

  /**
   * Update the annotation when the feature changes.
   *
   * @protected
   */
  handleFeatureChange() {
    this.setVisibleInternal();
  }
}
