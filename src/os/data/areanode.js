goog.declareModuleId('os.data.AreaNode');

import {listen, unlistenByKey} from 'ol/src/events.js';

import AreaToggle from '../command/areatogglecmd.js';
import CommandProcessor from '../command/commandprocessor.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import osImplements from '../implements.js';
import * as query from '../query/query.js';
import {getAreaManager, getQueryManager} from '../query/queryinstance.js';
import {isStateFile} from '../state/state.js';
import TriState from '../structs/tristate.js';
import IMenuSupplier from '../ui/menu/imenusupplier.js';
import * as spatial from '../ui/menu/spatial.js';
import {directiveTag as nodeUi} from '../ui/node/areanodeui.js';
import QueryAreaNode from '../ui/query/areanode.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: ISearchable} = goog.requireType('os.data.ISearchable');


/**
 * Tree nodes for areas
 *
 * @implements {ISearchable}
 * @implements {IMenuSupplier}
 */
export default class AreaNode extends QueryAreaNode {
  /**
   * Constructor.
   * @param {!ol.Feature=} opt_area
   */
  constructor(opt_area) {
    super(opt_area);

    var qm = getQueryManager();
    qm.listen(GoogEventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);

    this.listenKey = null;
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
      if (this.area && this.listenKey) {
        unlistenByKey(this.listenKey);
      }

      var old = this.area;
      this.area = area;
      this.updateFromArea();

      if (this.area) {
        this.nodeUI = `<${nodeUi}></${nodeUi}>`;
        this.listenKey = listen(this.area, 'toggle', this.onAreaToggled, this);
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
