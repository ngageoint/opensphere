goog.module('os.command.EditLayerFeatures');

const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');
const State = goog.require('os.command.State');
const {getMapContainer} = goog.require('os.map.instance');

const Feature = goog.requireType('ol.Feature');


/**
 */
class EditLayerFeatures extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {Array<Feature>} features
   * @param {boolean} addition Is this an addition or removal
   */
  constructor(layerId, features, addition) {
    super();
    this.title = 'Add Features';

    /**
     * @type {Array<Feature>}
     * @private
     */
    this.features_ = features;
    /**
     * @type {string}
     * @private
     */
    this.layerId_ = layerId;
    /**
     * @type {boolean}
     * @private
     */
    this.addition_ = addition;

    if (this.layerId_ && this.features_) {
      this.title = (this.addition_ ? 'Add ' : 'Remove ') + this.features_.length +
          ' feature' + (this.features_.length === 1 ? '' : 's');
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute_()) {
      this.state = State.EXECUTING;

      var res = (this.addition_ ? this.add_() : this.remove_());
      if (res) {
        this.finish();
      }
      return res;
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    if (this.canExecute_()) {
      this.state = State.REVERTING;

      var res = (this.addition_ ? this.remove_() : this.add_());
      if (res) {
        super.revert();
      }
      return res;
    }
    return false;
  }

  /**
   * Adds features to the layer
   *
   * @private
   * @return {boolean}
   */
  add_() {
    var layer = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.layerId_));
    if (layer != null && this.features_) {
      var source = /** @type {os.source.ISource} */ (layer.getSource());
      source.addFeatures(this.features_);
      return true;
    }
    return this.handleError('Layer is not defined .');
  }

  /**
   * Removes features from the layer.
   *
   * @private
   * @return {boolean}
   */
  remove_() {
    var layer = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.layerId_));
    if (layer != null) {
      var source = /** @type {os.source.ISource} */ (layer.getSource());
      if (source) {
        // TODO: when OL3 gets its act together and has a removeFeatures() method to go along with
        // addFeatures(), use that
        for (var i = 0, n = this.features_.length; i < n; i++) {
          source.removeFeature(this.features_[i]);
        }
        return true;
      }
      return this.handleError('Source is not defined.');
    }
    return this.handleError('Layer is not defined.');
  }

  /**
   * Can this command execute
   *
   * @private
   * @return {boolean}
   */
  canExecute_() {
    if (!(this.state === State.SUCCESS || this.state === State.READY)) {
      return this.handleError('Command not in good state.');
    }

    if (!this.features_) {
      return this.handleError('Features not provided');
    }
    return true;
  }
}

exports = EditLayerFeatures;
