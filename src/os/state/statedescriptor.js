goog.module('os.state.StateDescriptor');

const log = goog.require('goog.log');
const StateType = goog.require('os.state.StateType');
const {DEFAULT_LAYER_COLOR} = goog.require('os.style');
const {default: Icons} = goog.require('os.ui.Icons');
const {default: AbstractStateDescriptor} = goog.require('os.ui.state.AbstractStateDescriptor');

const Logger = goog.requireType('goog.log.Logger');
const OSFile = goog.requireType('os.file.File');
const XMLStateOptions = goog.requireType('os.state.XMLStateOptions');


/**
 * Descriptor for state files.
 */
class StateDescriptor extends AbstractStateDescriptor {
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

exports = StateDescriptor;
