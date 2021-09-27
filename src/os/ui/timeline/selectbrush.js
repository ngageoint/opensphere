goog.declareModuleId('os.ui.timeline.SelectBrush');

import * as dispatcher from '../../dispatcher.js';
import {openMenu} from '../globalmenu.js';
import GlobalMenuEventType from '../globalmenueventtype.js';
import Brush from './brush.js';
import BrushEventType from './brusheventtype.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: ActionManager} = goog.requireType('os.ui.action.ActionManager');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');


/**
 * Implements shift+click to draw a brush selection
 */
export default class SelectBrush extends Brush {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setId('select');
    this.setEventType(BrushEventType.BRUSH_END);

    /**
     * @type {?string}
     * @private
     */
    this.menuContainer_ = null;

    /**
     * @type {?ActionManager}
     * @private
     */
    this.am_ = null;

    /**
     * @type {?Menu<Array<number>>}
     * @private
     */
    this.menu_ = null;

    /**
     * @type {function(Event):(boolean|undefined)}
     * @private
     */
    this.moveHandler_ = this.onMouseMove_.bind(this);

    /**
     * @type {?Array.<number>}
     * @private
     */
    this.position_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.inEvent_ = false;
  }

  /**
   * @param {Menu<Array<number>>} menu The menu
   */
  setMenu(menu) {
    this.menu_ = menu;
  }

  /**
   * @param {ActionManager} manager The action manager
   */
  setActionManager(manager) {
    this.am_ = manager;
  }

  /**
   * @param {string} container Menu container
   */
  setMenuContainer(container) {
    this.menuContainer_ = container;
  }

  /**
   * @inheritDoc
   */
  initSVG(container, height) {
    d3.select('.c-svg-timeline').
        on(GoogEventType.MOUSEDOWN + '.' + this.getId(), this.onDraw_.bind(this), true);
    super.initSVG(container, height);
  }

  /**
   * Begins drawing the selection
   *
   * @return {boolean|undefined}
   * @private
   */
  onDraw_() {
    var evt = /** @type {MouseEvent} */ (d3.event);

    if (evt.shiftKey && !this.inEvent_) {
      this.inEvent_ = true;
      this.dispatchEvent(GoogEventType.DRAGSTART);
      // start brush
      try {
        // modern browsers
        var event = new MouseEvent(evt.type, /** @type {MouseEventInit} */ (evt));
      } catch (e) {
        // IE
        event = document.createEvent('MouseEvents');
        event.initMouseEvent(evt.type, true, true, evt.view, evt.detail, evt.screenX, evt.screenY, evt.clientX,
            evt.clientY, evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, evt.button, evt.relatedTarget);
      }

      d3.select('.brush-' + this.getId()).select('.background').node().dispatchEvent(event);

      // track mouse position
      window.addEventListener(GoogEventType.MOUSEMOVE, this.moveHandler_, true);

      // kill the original
      d3.event.preventDefault();
      d3.event.stopPropagation();
      this.inEvent_ = false;
      return false;
    }
  }

  /**
   * @inheritDoc
   */
  onBrushStart() {
    super.onBrushStart();
    this.resizing = true;
    this.stillValue = this.xScale.invert(d3.mouse(d3.select('.x-axis').node())[0]).getTime();
  }

  /**
   * @param {Event} event
   * @private
   */
  onMouseMove_(event) {
    var evt = /** @type {MouseEvent} */ (event);
    this.position_ = [evt.pageX, evt.pageY];
  }

  /**
   * @inheritDoc
   */
  updateBrush(opt_silent) {
    super.updateBrush(opt_silent);

    if (d3.event && d3.event.type == BrushEventType.BRUSH_END) {
      var ex = this.getExtent();

      if ((this.am_ || this.menu_) && this.menuContainer_ && ex && !this.inEvent_) {
        this.inEvent_ = true;

        window.removeEventListener(GoogEventType.MOUSEMOVE, this.moveHandler_, true);

        var fn = /** @type {d3.ScaleFn} */ (this.xScale);

        var pos = {
          x: this.position_ ? this.position_[0] : fn(ex[1]),
          y: this.position_ ? this.position_[1] : 75
        };

        var target = '.c-svg-timeline';

        var targetEl = document.querySelector(target);
        if (targetEl) {
          // offset the brush position by the timeline's left edge
          var rect = targetEl.getBoundingClientRect();
          pos.x -= rect.x;
        }

        if (this.menu_) {
          this.menu_.open(ex, {
            my: 'left top',
            at: 'left+' + pos.x + ' top+' + pos.y,
            of: target
          });
        } else if (this.am_) {
          this.am_.withActionArgs(ex);
          openMenu(this.am_, pos, this.position_ ? undefined : target);
        }

        dispatcher.getInstance().listen(GlobalMenuEventType.MENU_CLOSE, this.onMenuEnd_, false, this);

        this.position_ = null;
        this.inEvent_ = false;

        d3.select('.brush-' + this.getId()).select('.background').style('display', 'none');
      } else {
        // dispatch the event to keep things moving
        this.dispatchEvent(GoogEventType.CHANGE);
      }
    }
  }

  /**
   * Handles menu close
   *
   * @private
   */
  onMenuEnd_() {
    this.inEvent_ = true;
    this.setExtent(null);
    this.dispatchEvent(GoogEventType.EXIT);
    this.inEvent_ = false;
  }

  /**
   * @inheritDoc
   */
  updateLabels() {
    if (this.mouseDown) {
      super.updateLabels();
    } else {
      d3.select('.brush-' + this.getId()).selectAll('text').style('display', 'none');
    }
  }
}
