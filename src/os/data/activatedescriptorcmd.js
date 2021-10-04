goog.declareModuleId('os.data.ActivateDescriptor');

import EventType from '../command/eventtype.js';
import State from '../command/state.js';
import AbstractDescriptor from './abstractdescriptorcmd.js';

const GoogEvent = goog.require('goog.events.Event');
const log = goog.require('goog.log');

const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');


/**
 * Command to activate a descriptor.
 */
export default class ActivateDescriptor extends AbstractDescriptor {
  /**
   * Constructor.
   * @param {!IDataDescriptor} descriptor The descriptor
   */
  constructor(descriptor) {
    super(descriptor);
    this.log = logger;

    var type = descriptor.getType();
    this.title = 'Add ' + (type ? type + ' ' : '') + '"' + descriptor.getTitle() + '"';
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      return this.activateDescriptor();
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    return this.deactivateDescriptor();
  }

  /**
   * @inheritDoc
   */
  onActivated(opt_event) {
    this.removeListeners();
    this.state = State.SUCCESS;
    this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
  }

  /**
   * @inheritDoc
   */
  onDeactivated(opt_event) {
    this.removeListeners();
    this.state = State.READY;
    this.dispatchEvent(new GoogEvent(EventType.REVERTED));
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.data.ActivateDescriptor');
