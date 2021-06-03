goog.module('os.command.TransformVectors');
goog.module.declareLegacyNamespace();

const Geometry = goog.require('ol.geom.Geometry');
const OLVectorLayer = goog.require('ol.layer.Vector');
const olProj = goog.require('ol.proj');
const MapContainer = goog.require('os.MapContainer');
const State = goog.require('os.command.State');
const RecordField = goog.require('os.data.RecordField');
const osFeature = goog.require('os.feature');
const geo2 = goog.require('os.geo2');
const interpolate = goog.require('os.interpolate');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract command for performing selections on a source
 *
 * @implements {ICommand}
 */
class TransformVectors {
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
    var layers = MapContainer.getInstance().getLayers();
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

      if (layer instanceof OLVectorLayer) {
        var source = layer.getSource();

        if (source) {
          var features = source.getFeatures();

          // we can't merely change the features in place because os.source.Vector has an override
          // that removes the listener on feature change (because it is otherwise not used). Instead,
          // we'll remove, transform, and re-add the features.

          if (features.length) {
            source.clear(true);

            for (var j = 0, m = features.length; j < m; j++) {
              osFeature.forEachGeometry(features[j], tx);

              for (var k = 0, l = extraGeoms.length; k < l; k++) {
                tx(/** @type {ol.geom.Geometry|undefined} */ (features[j].get(extraGeoms[k])));
              }
            }

            source.addFeatures(features);
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

exports = TransformVectors;
