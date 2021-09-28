goog.declareModuleId('os.data.DeactivateDescriptor');

import EventType from '../command/eventtype.js';
import State from '../command/state.js';
import AbstractDescriptor from './abstractdescriptorcmd.js';

const GoogEvent = goog.require('goog.events.Event');
const log = goog.require('goog.log');


/**
 * Command to deactivate a descriptor.
 */
export default class DeactivateDescriptor extends AbstractDescriptor {
  /**
   * Constructor.
   * @param {!os.data.IDataDescriptor} descriptor The descriptor
   */
  constructor(descriptor) {
    super(descriptor);
    this.log = logger;

    var type = descriptor.getType();
    this.title = 'Remove ' + (type ? type + ' ' : '') + '"' + descriptor.getTitle() + '"';
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      return this.deactivateDescriptor();
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    return this.activateDescriptor();
  }

  /**
   * @inheritDoc
   */
  onActivated(opt_event) {
    this.removeListeners();
    this.state = State.READY;
    this.dispatchEvent(new GoogEvent(EventType.REVERTED));
  }

  /**
   * @inheritDoc
   */
  onDeactivated(opt_event) {
    this.removeListeners();
    this.state = State.SUCCESS;
    this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.data.DeactivateDescriptor');
