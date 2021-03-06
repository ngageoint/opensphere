goog.module('plugin.file.kml.KMLImporter');
goog.module.declareLegacyNamespace();

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');

const AlertManager = goog.require('os.alert.AlertManager');
const osFeature = goog.require('os.feature');
const FeatureImporter = goog.require('os.im.FeatureImporter');


const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleType = goog.require('os.style.StyleType');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');


/**
 * Imports a set of KML items
 *
 * @extends {FeatureImporter.<plugin.file.kml.ui.KMLNode>}
 */
class KMLImporter extends FeatureImporter {
  /**
   * Constructor.
   * @param {plugin.file.kml.KMLParser} parser The parser
   */
  constructor(parser) {
    super(parser);

    /**
     * The last parsed KML root node
     * @type {plugin.file.kml.ui.KMLNode}
     * @private
     */
    this.rootNode_ = null;

    /**
     * Columns detected in the KML
     * @type {Array<!os.data.ColumnDefinition>}
     * @private
     */
    this.columns_ = null;

    /**
     * minimum refresh interval from the NetworkLinkControl
     * @type {number}
     * @private
     */
    this.minRefreshPeriod_ = 0;

    /**
     * Number of invalid polygons detected on import
     * @type {number}
     * @private
     */
    this.invalidCount_ = 0;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.rootNode_ = null;
  }

  /**
   * Get the root KML tree node.
   * @param {boolean=} opt_clear If the root node should be cleared on call.
   * @return {plugin.file.kml.ui.KMLNode}
   */
  getRootNode(opt_clear = false) {
    var rootNode = this.rootNode_;
    if (opt_clear) {
      this.rootNode_ = null;
    }
    return rootNode;
  }

  /**
   * Get columns detected in the KML.
   *
   * @return {Array<!os.data.ColumnDefinition>}
   */
  getColumns() {
    return this.columns_;
  }

  /**
   * Get columns detected in the KML.
   *
   * @return {number}
   */
  getMinRefreshPeriod() {
    return this.minRefreshPeriod_;
  }

  /**
   * @inheritDoc
   */
  onParserReady(opt_event) {
    // if a KML tree was previously parsed, set it on the parser so the tree is merged
    this.parser.setRootNode(this.rootNode_);

    super.onParserReady(opt_event);
  }

  /**
   * @inheritDoc
   */
  onParsingComplete(opt_event) {
    // grab the newly parsed KML tree before it's removed by parser cleanup
    this.rootNode_ = this.parser.getRootNode();
    this.columns_ = this.parser.getColumns();
    this.minRefreshPeriod_ = this.parser.getMinRefreshPeriod();

    if (this.invalidCount_ > 0) {
      var msg = this.invalidCount_ === 1 ? 'An area was' : (this.invalidCount_ + ' areas were');
      AlertManager.getInstance().sendAlert(msg + ' removed from the original due to invalid topology. One possible ' +
          ' reason is a repeating or invalid coordinate.',
      AlertEventSeverity.WARNING);
    }

    super.onParsingComplete(opt_event);
  }

  /**
   * @inheritDoc
   */
  sanitize(item) {
    var feature = null;
    if ((item instanceof SlickTreeNode) && (item.getFeature())) {
      feature = /** @type {ol.Feature} */ (item.getFeature());
    }

    if (feature) {
      this.invalidCount_ += osFeature.validateGeometries(feature, false);
      super.sanitize(feature);
    }
  }

  /**
   * @inheritDoc
   */
  performMappings(item) {
    var feature = null;
    if (item.getFeature()) {
      feature = /** @type {ol.Feature} */ (item.getFeature());
    }

    if (feature && (this.mappings || this.autoMappings)) {
      super.performMappings(feature);

      // line dash isn't part of kml spec, translate it here
      var lineDash = /** @type {string} */ (feature.get(StyleField.LINE_DASH));
      if (lineDash) {
        var dash = /** @type {Array<number>} */ (JSON.parse(lineDash));
        var config = osStyle.getBaseFeatureConfig(feature);
        osStyle.setConfigLineDash(config, dash);
        feature.set(StyleType.FEATURE, config);
      }
    }
  }
}

exports = KMLImporter;
