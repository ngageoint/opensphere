goog.declareModuleId('os.ui.query.cmd.AreaModify');

import State from '../../../command/state.js';
import {ORIGINAL_GEOM_FIELD} from '../../../interpolate.js';
import {getAreaManager} from '../../../query/queryinstance.js';
import AbstractArea from './abstractareacmd.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Command for modifying an area
 *
 * @implements {ICommand}
 */
export default class AreaModify extends AbstractArea {
  /**
   * Constructor.
   * @param {!Feature} area
   * @param {!Geometry} geometry
   */
  constructor(area, geometry) {
    super(area);

    /**
     * @type {Geometry|undefined}
     * @protected
     */
    this.newGeometry = undefined;

    /**
     * @type {Geometry|undefined}
     * @protected
     */
    this.oldGeometry = undefined;

    // this will prevent the command from executing if the area isn't in the query manager already
    if (getAreaManager().get(area)) {
      this.newGeometry = geometry;
      this.oldGeometry = area.getGeometry();
    }

    this.title = 'Modify area';
    if (area) {
      var areaTitle = area.get('title');
      if (areaTitle) {
        this.title += ' "' + areaTitle + '"';
      }
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      // update the geometry and re-add the area to trigger a refresh
      this.area.set(ORIGINAL_GEOM_FIELD, undefined);
      this.area.setGeometry(this.newGeometry);
      getAreaManager().remove(this.area);
      getAreaManager().add(this.area);

      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    // revert to the original geometry and re-add the area to trigger a refresh
    this.area.set(ORIGINAL_GEOM_FIELD, undefined);
    this.area.setGeometry(this.oldGeometry);
    getAreaManager().remove(this.area);
    getAreaManager().add(this.area);

    this.state = State.READY;
    return true;
  }

  /**
   * @inheritDoc
   */
  canExecute() {
    if (!this.oldGeometry) {
      this.details = 'Original area unknown.';
      return false;
    }

    if (!this.newGeometry) {
      this.details = 'No new area provided.';
      return false;
    }

    return super.canExecute();
  }
}
