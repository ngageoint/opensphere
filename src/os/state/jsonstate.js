goog.declareModuleId('os.state.JSONState');

import {merge} from '../object/object.js';
import AbstractState from './abstractstate.js';
import Tag from './tag.js';

const {default: JSONStateOptions} = goog.requireType('os.state.JSONStateOptions');


/**
 * Base class for JSON states.
 *
 * @extends {AbstractState<!Object<string, *>, JSONStateOptions>}
 */
export default class JSONState extends AbstractState {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  createRoot(options) {
    var rootObj = {};
    if (this.rootAttrs) {
      merge(this.rootAttrs, rootObj, false);
    }

    return rootObj;
  }

  /**
   * @inheritDoc
   */
  getSource(obj) {
    // TODO: support this if the application that created the state file is required. we may have to pass the root object
    // to the load function so it can be used here. objects can't walk up to the parent like XML elements can.
    return null;
  }

  /**
   * @inheritDoc
   */
  saveComplete(options, rootObj) {
    if (!options.obj[Tag.STATE]) {
      options.obj[Tag.STATE] = [];
    }
    rootObj[Tag.TYPE] = this.rootName;
    options.obj[Tag.STATE].push(rootObj);

    super.saveComplete(options, rootObj);
  }
}
