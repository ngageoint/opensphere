goog.declareModuleId('plugin.openpage.Plugin');

import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import Peer from '../../os/xt/peer.js';
import Handler from './handler.js';
import {ID} from './openpage.js';

/**
 * Adds layers from XT messages sent by the addlayer.html page.
 */
export default class Plugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    Peer.getInstance().addHandler(new Handler());
  }

  /**
   * Get the global instance.
   * @return {!Plugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new Plugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Plugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {Plugin|undefined}
 */
let instance;
