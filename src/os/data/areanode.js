goog.module('os.data.AreaNode');

const GoogEventType = goog.require('goog.events.EventType');
const events = goog.require('ol.events');
const AreaToggle = goog.require('os.command.AreaToggle');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osImplements = goog.require('os.implements');
const query = goog.require('os.query');
const {getAreaManager, getQueryManager} = goog.require('os.query.instance');
const {isStateFile} = goog.require('os.state');
const TriState = goog.require('os.structs.TriState');
const IMenuSupplier = goog.require('os.ui.menu.IMenuSupplier');
const spatial = goog.require('os.ui.menu.spatial');
const {directiveTag: nodeUi} = goog.require('os.ui.node.AreaNodeUI');
const QueryAreaNode = goog.require('os.ui.query.AreaNode');

const ISearchable = goog.requireType('os.data.ISearchable');


/**
 * Tree nodes for areas
 *
 * @implements {ISearchable}
 * @implements {IMenuSupplier}
 */
class AreaNode extends QueryAreaNode {
  /**
   * Constructor.
   * @param {!ol.Feature=} opt_area
   */
  constructor(opt_area) {
    super(opt_area);

    var qm = getQueryManager();
    qm.listen(GoogEventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    var qm = getQueryManager();
    qm.unlisten(GoogEventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
  }

  /**
   * @inheritDoc
   */
  getMenu() {
    return spatial.getMenu();
  }

  /**
   * @inheritDoc
   */
  setArea(area) {
    if (area !== this.area) {
      if (this.area) {
        events.unlisten(this.area, 'toggle', this.onAreaToggled, this);
      }

      var old = this.area;
      this.area = area;
      this.updateFromArea();

      if (this.area) {
        this.nodeUI = `<${nodeUi}></${nodeUi}>`;
        events.listen(this.area, 'toggle', this.onAreaToggled, this);
      } else {
        this.nodeUI = '';
      }

      this.dispatchEvent(new PropertyChangeEvent('area', area, old));
    } else {
      // the area's properties may have changed, so update the node
      this.updateFromArea();
    }
  }

  /**
   * @param {PropertyChangeEvent} event
   * @private
   */
  onQueriesChanged_(event) {
    this.dispatchEvent(new PropertyChangeEvent('icons'));
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    if (value !== TriState.BOTH) {
      var old = this.getState();
      this.setStateInternal(value);
      var s = this.getState();

      if (old != s && this.area) {
        var show = s !== TriState.OFF;
        var shown = /** @type {boolean} */ (this.area.get('shown'));

        // we only need to fire a command if the feature differs
        if (show !== shown) {
          var cmd = new AreaToggle(this.area, show);
          CommandProcessor.getInstance().addCommand(cmd);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  onMouseEnter() {
    getAreaManager().highlight(this.area);
  }

  /**
   * @inheritDoc
   */
  onMouseLeave() {
    getAreaManager().unhighlight(this.area);
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var area = this.getArea();
    var result = getQueryManager().hasArea(/** @type {string} */ (area.getId()));

    var icon;
    var tooltip;
    var statecopy = '';
    var badgecolor = '';

    switch (result) {
      case query.AreaState.EXCLUSION:
        icon = 'fa-ban text-danger';
        tooltip = 'This area is an exclusion';
        badgecolor = 'text-danger';
        break;
      case query.AreaState.INCLUSION:
        icon = 'fa-circle u-text-yellow';
        tooltip = 'This area is querying features';
        badgecolor = 'u-text-yellow';
        break;
      case query.AreaState.BOTH:
        icon = 'fa-times-circle text-warning';
        tooltip = 'This area is being used for queries and exclusions';
        badgecolor = 'text-warning';
        break;
      case query.AreaState.NONE:
      default:
        icon = 'fa-circle-o';
        tooltip = 'This area is being displayed on the map';
        break;
    }

    if (icon) {
      if (isStateFile(this.getId())) {
        statecopy = 'fa fa-bookmark ';
      }
      return ' <i class="fa ' + icon + '" title="' + tooltip + '"></i> <i class=" ' +
        statecopy + badgecolor + '" title="This is from a state file"></i>';
    }

    return super.formatIcons();
  }
}
osImplements(AreaNode, IMenuSupplier.ID);


exports = AreaNode;
