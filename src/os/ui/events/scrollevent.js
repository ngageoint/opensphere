goog.module('os.ui.events.ScrollEvent');
goog.module.declareLegacyNamespace();

const Event = goog.require('goog.events.Event');


/**
 * Event that carries a selector to tell a section to scroll.
 */
class ScrollEvent extends Event {
  /**
   * Constructor.
   * @param {string} selector The selector to scroll to
   * @param {string=} opt_focus Optional element to focus
   */
  constructor(selector, opt_focus) {
    super('scrollto');

    /**
     * @type {string}
     * @private
     */
    this.selector_ = selector;

    /**
     * @type {string|undefined}
     * @private
     */
    this.focus_ = opt_focus;
  }

  /**
   * @return {string}
   */
  getSelector() {
    return this.selector_;
  }

  /**
   * @return {string|undefined}
   */
  getFocus() {
    return this.focus_;
  }
}

exports = ScrollEvent;
