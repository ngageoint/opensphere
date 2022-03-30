goog.declareModuleId('os.command.TransformVectors');

import Geometry from 'ol/src/geom/Geometry.js';
import VectorLayer from 'ol/src/layer/Vector.js';
import * as olProj from 'ol/src/proj.js';

import RecordField from '../data/recordfield.js';
import * as osFeature from '../feature/feature.js';
import * as geo2 from '../geo/geo2.js';
import * as interpolate from '../interpolate.js';
import {getMapContainer} from '../map/mapinstance.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Abstract command for performing selections on a source
 *
 * @implements {ICommand}
 */
export default class TransformVectors {
  /**
   * Constructor.
   * @param {!ol.ProjectionLike} source
   * @param {!ol.ProjectionLike} target
   */
  constructor(source, target) {
    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Transform all vectors';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @type {!ol.ProjectionLike}
     * @protected
     */
    this.source = source;

    /**
     * @type {!ol.ProjectionLike}
     * @protected
     */
    this.target = target;
  }

  /**
   * Checks if the command is ready to execute
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.source) {
      this.state = State.ERROR;
      this.details = 'Source projection is not defined';
      return false;
    }

    if (!this.target) {
      this.state = State.ERROR;
      this.details = 'Target projection is not defined';
      return false;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var source = olProj.get(this.source);
      var target = olProj.get(this.target);

      if (source && target) {
        this.transform(source, target);
      }

      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @param {!ol.proj.Projection} sourceProjection
   * @param {!ol.proj.Projection} targetProjection
   * @protected
   */
  transform(sourceProjection, targetProjection) {
    var layers = getMapContainer().getLayers();
    var tx = TransformVectors.transform_.bind(null, sourceProjection, targetProjection);

    // list of geometry caches to also transform which aren't generally considered part of the
    // geometry/style set
    const extraGeoms = [
      interpolate.ORIGINAL_GEOM_FIELD,
      RecordField.ELLIPSE,
      RecordField.LINE_OF_BEARING,
      RecordField.RING];

    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = layers[i];

      if (layer instanceof VectorLayer) {
        var source = layer.getSource();

        if (source) {
          var features = source.getFeatures();
          if (features.length) {
            for (var j = 0, m = features.length; j < m; j++) {
              osFeature.forEachGeometry(features[j], tx);

              for (var k = 0, l = extraGeoms.length; k < l; k++) {
                tx(/** @type {ol.geom.Geometry|undefined} */ (features[j].get(extraGeoms[k])));
              }
            }
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var source = olProj.get(this.source);
    var target = olProj.get(this.target);

    if (source && target) {
      this.transform(target, source);
    }

    this.state = State.READY;
    return true;
  }

  /**
   * @param {!ol.proj.Projection} sourceProjection
   * @param {!ol.proj.Projection} targetProjection
   * @param {?ol.geom.Geometry|undefined} geom
   * @private
   */
  static transform_(sourceProjection, targetProjection, geom) {
    if (geom && geom instanceof Geometry) {
      geom.transform(sourceProjection, targetProjection);
      geo2.normalizeGeometryCoordinates(geom, undefined, targetProjection);
    }
  }
}
