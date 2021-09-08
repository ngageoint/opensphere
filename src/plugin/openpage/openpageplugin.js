goog.module('plugin.openpage.Plugin');

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const Peer = goog.require('os.xt.Peer');
const {ID} = goog.require('plugin.openpage');
const Handler = goog.require('plugin.openpage.Handler');


/**
 * Adds layers from XT messages sent by the addlayer.html page.
 */
class Plugin extends AbstractPlugin {
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

exports = Plugin;
