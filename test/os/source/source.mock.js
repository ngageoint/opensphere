goog.module('os.source.MockSource');

const ISource = goog.requireType('os.source.ISource');


/**
 * Mock source.
 * @implements {ISource}
 */
class MockSource {
  /**
   * Constructor.
   */
  constructor() {
    this.columns = [];
    this.id = 'testSource';
    this.features = [];
    this.enabled = true;
    this.loading = false;
    this.lockable = false;
    this.refreshInterval = 0;
  }

  /**
   * @inheritDoc
   */
  addFeature(feature) {
    this.features.push(feature);
  }

  /**
   * @inheritDoc
   */
  removeFeature(feature) {
    var idx = this.features.indexOf(feature);
    if (idx > -1) {
      this.features.splice(idx, 1);
    }
  }

  /**
   * @inheritDoc
   */
  addFeatures(features) {
    this.features = this.features.concat(features);
  }

  /**
   * @inheritDoc
   */
  clear() {
    this.features.length = 0;
  }

  /**
   * @inheritDoc
   */
  refresh() {}

  /**
   * @inheritDoc
   */
  isRefreshEnabled() {
    return true;
  }

  /**
   * @inheritDoc
   */
  getRefreshInterval() {
    return this.refreshInterval;
  }

  /**
   * @inheritDoc
   */
  setRefreshInterval(value) {
    this.refreshInterval = value;
  }

  /**
   * @inheritDoc
   */
  onRefreshDelay() {}

  /**
   * @inheritDoc
   */
  getColor() {
    return 'rgba(255,255,255,1)';
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    return this.columns.slice();
  }

  /**
   * @inheritDoc
   */
  getColumnsArray() {
    return this.columns;
  }

  /**
   * @inheritDoc
   */
  setColumns(value) {
    this.columns = value;
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
  isLockable() {
    return this.lockable;
  }

  /**
   * @inheritDoc
   */
  setLockable(value) {
    this.lockable = value;
  }

  /**
   * @inheritDoc
   */
  isLocked() {}

  /**
   * @inheritDoc
   */
  setLocked() {}

  /**
   * @inheritDoc
   */
  getTitle() {}

  /**
   * @inheritDoc
   */
  setTitle() {}

  /**
   * @inheritDoc
   */
  getTimeEnabled() {}

  /**
   * @inheritDoc
   */
  getTimeModel() {}

  /**
   * @inheritDoc
   */
  setTimeEnabled() {}

  /**
   * @inheritDoc
   */
  getVisible() {}

  /**
   * @inheritDoc
   */
  setVisible() {}

  /**
   * @inheritDoc
   */
  forEachFeature(callback, opt_this) {
    this.features.forEach(callback, opt_this);
  }

  /**
   * @inheritDoc
   */
  getFeatures() {
    return this.features;
  }

  /**
   * @inheritDoc
   */
  getHighlightedItems() {
    return [];
  }

  /**
   * @inheritDoc
   */
  setHighlightedItems() {}

  /**
   * @inheritDoc
   */
  displayAll() {}

  /**
   * @inheritDoc
   */
  hideAll() {}

  /**
   * @inheritDoc
   */
  hideFeatures() {}

  /**
   * @inheritDoc
   */
  showFeatures() {}

  /**
   * @inheritDoc
   */
  hideSelected() {}

  /**
   * @inheritDoc
   */
  hideUnselected() {}

  /**
   * @inheritDoc
   */
  getHiddenItems() {
    return [];
  }

  /**
   * @inheritDoc
   */
  isHidden() {
    return false;
  }

  /**
   * @inheritDoc
   */
  getUnselectedItems() {
    return [];
  }

  /**
   * @inheritDoc
   */
  isSelected() {
    return false;
  }

  /**
   * @inheritDoc
   */
  getSelectedItems() {
    return [];
  }

  /**
   * @inheritDoc
   */
  setSelectedItems() {}

  /**
   * @inheritDoc
   */
  addToSelected() {}

  /**
   * @inheritDoc
   */
  removeFromSelected() {}

  /**
   * @inheritDoc
   */
  selectAll() {}

  /**
   * @inheritDoc
   */
  selectNone() {}
}

exports = MockSource;
