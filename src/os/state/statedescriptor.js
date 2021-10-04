goog.declareModuleId('os.state.StateDescriptor');

import {DEFAULT_LAYER_COLOR} from '../style/style.js';
import Icons from '../ui/icons.js';
import AbstractStateDescriptor from '../ui/state/abstractstatedescriptor.js';
import StateType from './statetype.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: XMLStateOptions} = goog.requireType('os.state.XMLStateOptions');


/**
 * Descriptor for state files.
 */
export default class StateDescriptor extends AbstractStateDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
    this.stateType = StateType.OPENSPHERE;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return Icons.STATE;
  }

  /**
   * Creates a state descriptor from a file.
   *
   * @param {!OSFile} file The file
   * @return {!StateDescriptor} The descriptor
   */
  static createFromFile(file) {
    var descriptor = new StateDescriptor();
    descriptor.setColor(DEFAULT_LAYER_COLOR);
    descriptor.setUrl(file.getUrl());

    return descriptor;
  }

  /**
   * Updates an existing descriptor from a parser configuration.
   *
   * @param {!StateDescriptor} descriptor
   * @param {!XMLStateOptions} options The save options
   */
  static updateFromOptions(descriptor, options) {
    descriptor.setTitle(options.title);
    descriptor.setDescription(options.description);
    descriptor.setTags(options.tags ? options.tags.split(/\s*,\s*/) : null);

    if (options.states) {
      var loadItems = [];
      for (var i = 0, n = options.states.length; i < n; i++) {
        var state = options.states[i];
        if (state.getEnabled()) {
          loadItems.push(state.toString());
        }
      }

      if (loadItems.length > 0) {
        descriptor.setLoadItems(loadItems);
      }
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.StateDescriptor');
