goog.declareModuleId('os.data.AbstractDescriptor');

import EventType from '../command/eventtype.js';
import ICommand from '../command/icommand.js';// eslint-disable-line
import State from '../command/state.js';
import Metrics from '../metrics/metrics.js';
import * as keys from '../metrics/metricskeys.js';
import DataManager from './datamanager.js';
import DescriptorEventType from './descriptoreventtype.js';

const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');


/**
 * Abstract command for activating/deactivating descriptors.
 *
 * @abstract
 * @implements {ICommand}
 */
export default class AbstractDescriptor extends EventTarget {
  /**
   * Constructor.
   * @param {!IDataDescriptor} descriptor The descriptor
   */
  constructor(descriptor) {
    super();

    /**
     * Whether or not the command is asynchronous.
     * @type {boolean}
     */
    this.isAsync = true;

    /**
     * The title of the command.
     * @type {?string}
     */
    this.title = 'Activate/Deactivate Descriptor';

    /**
     * The details of the command.
     * @type {?string}
     */
    this.details = null;

    /**
     * Return the current state of the command.
     * @type {!State}
     */
    this.state = State.READY;

    /**
     * The descriptor ID
     * @type {string}
     * @protected
     */
    this.id = descriptor.getId();

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  execute() {}

  /**
   * @abstract
   * @inheritDoc
   */
  revert() {}

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.removeListeners();
  }

  /**
   * Get the descriptor by id.
   *
   * @return {IDataDescriptor}
   */
  getDescriptor() {
    return this.id ? DataManager.getInstance().getDescriptor(this.id) : null;
  }

  /**
   * Checks if the command is ready to execute.
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.getDescriptor()) {
      this.state = State.ERROR;
      this.details = 'Descriptor not registered in DataManager!';
      return false;
    }

    return true;
  }

  /**
   * Activates the descriptor.
   *
   * @return {boolean} If the operation was successful
   * @protected
   */
  activateDescriptor() {
    try {
      var descriptor = this.getDescriptor();
      if (descriptor && !descriptor.isActive()) {
        descriptor.listenOnce(DescriptorEventType.ACTIVATED, this.onActivated, false, this);
        descriptor.listenOnce(DescriptorEventType.DEACTIVATED, this.onActivationError, false, this);
        descriptor.setActive(true);
        Metrics.getInstance().updateMetric(keys.AddData.ADD_LAYER_COMMAND, 1);
      } else {
        this.onActivated();
      }
    } catch (e) {
      log.error(this.log, 'Unable to activate descriptor: ' + e.message, e);
      this.removeListeners();
      this.state = State.ERROR;

      return false;
    }

    return true;
  }

  /**
   * Deactivates the descriptor.
   *
   * @return {boolean} If the operation was successful
   * @protected
   */
  deactivateDescriptor() {
    var descriptor = this.getDescriptor();
    if (descriptor && descriptor.isActive()) {
      descriptor.listenOnce(DescriptorEventType.DEACTIVATED, this.onDeactivated, false, this);
      descriptor.setActive(false);
      Metrics.getInstance().updateMetric(keys.AddData.REMOVE_LAYER_COMMAND, 1);
    } else {
      this.onDeactivated();
    }

    return true;
  }

  /**
   * Callback for the descriptor's activation event.
   *
   * @abstract
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onActivated(opt_event) {}

  /**
   * Callback for the descriptor's deactivation event.
   *
   * @abstract
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onDeactivated(opt_event) {}

  /**
   * Removes the listeners created by this command
   *
   * @protected
   */
  removeListeners() {
    var descriptor = this.getDescriptor();
    if (descriptor) {
      descriptor.unlisten(DescriptorEventType.ACTIVATED, this.onActivated, false, this);
      descriptor.unlisten(DescriptorEventType.DEACTIVATED, this.onDeactivated, false, this);
      descriptor.unlisten(DescriptorEventType.DEACTIVATED, this.onActivationError, false, this);
    }
  }

  /**
   * Handles errors in activating the descriptor.
   *
   * @protected
   */
  onActivationError() {
    this.removeListeners();
    this.state = State.ERROR;
    this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.data.AbstractDescriptor');
