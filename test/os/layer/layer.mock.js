goog.module('os.layer.MockLayer');

const {getRandomString} = goog.require('goog.string');
const {default: osImplements} = goog.require('os.implements');
const {default: ILayer} = goog.require('os.layer.ILayer');

const {default: SynchronizerType} = goog.require('os.layer.SynchronizerType');

const {default: IGroupable} = goog.requireType('os.IGroupable');


/**
 * Mock layer for testing.
 * @implements {ILayer}
 * @implements {IGroupable}
 */
class MockLayer {
  /**
   * Constructor.
   */
  constructor() {
    this.id = this.title = getRandomString();
    this.enabled = true;
    this.loading = false;
    this.explicitType = 'mock';
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id;
  }

  /**
   * @inheritDoc
   */
  setId(value) {
    this.id = value;
  }

  /**
   * @inheritDoc
   */
  getGroupId() {
    return this.getId();
  }

  /**
   * @inheritDoc
   */
  getGroupLabel() {
    return this.getTitle();
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    this.enabled = value;
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return this.loading;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    this.loading = value;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.title;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    this.title = value;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return '';
  }

  /**
   * @inheritDoc
   */
  getType() {
    return 'mock';
  }

  /**
   * @inheritDoc
   */
  setType(value) {}

  /**
   * @inheritDoc
   */
  getExplicitType() {
    return this.explicitType;
  }

  /**
   * @inheritDoc
   */
  setExplicitType(value) {
    this.explicitType = value;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return 'mock';
  }

  /**
   * @inheritDoc
   */
  setProvider(value) {}

  /**
   * @inheritDoc
   */
  getBrightness() {
    return 1;
  }

  /**
   * @inheritDoc
   */
  setBrightness(value) {}

  /**
   * @inheritDoc
   */
  getContrast() {
    return 1;
  }

  /**
   * @inheritDoc
   */
  setContrast(value) {}

  /**
   * @inheritDoc
   */
  getHue() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  setHue(value) {}

  /**
   * @inheritDoc
   */
  getOpacity() {
    return 1;
  }

  /**
   * @inheritDoc
   */
  setOpacity(value) {}

  /**
   * @inheritDoc
   */
  getSaturation() {
    return 1;
  }

  /**
   * @inheritDoc
   */
  setSaturation(value) {}

  /**
   * @inheritDoc
   */
  getLayerVisible() {
    return true;
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {}

  /**
   * @inheritDoc
   */
  getTags() {
    return [];
  }

  /**
   * @inheritDoc
   */
  setTags(value) {}

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    return {};
  }

  /**
   * @inheritDoc
   */
  setLayerOptions(value) {}

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return '';
  }

  /**
   * @inheritDoc
   */
  setNodeUI(value) {}

  /**
   * @inheritDoc
   */
  getGroupUI() {
    return '';
  }

  /**
   * @inheritDoc
   */
  getLayerUI() {
    return '';
  }

  /**
   * @inheritDoc
   */
  isRemovable() {
    return true;
  }

  /**
   * @inheritDoc
   */
  setRemovable(value) {}

  /**
   * @inheritDoc
   */
  getSynchronizerType() {
    return SynchronizerType.VECTOR;
  }

  /**
   * @inheritDoc
   */
  setSynchronizerType(value) {}

  /**
   * @inheritDoc
   */
  getHidden() {
    return false;
  }

  /**
   * @inheritDoc
   */
  setHidden(value) {}

  /**
   * Return the Z-index of the layer.
   * @return {number} The Z-index of the layer.
   */
  getZIndex() {
    return 0;
  }
}
osImplements(MockLayer, ILayer.ID);

exports = MockLayer;
