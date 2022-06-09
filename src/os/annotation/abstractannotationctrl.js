goog.declareModuleId('os.annotation.AbstractAnnotationCtrl');

import * as dispatcher from '../dispatcher.js';
import {EDIT_HEIGHT, EDIT_WIDTH, EventType} from './annotation.js';
import TailStyle from './tailstyle.js';
import TailType from './tailtype.js';

const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const dispose = goog.require('goog.dispose');


/**
 * @enum {string}
 */
const selectors = {
  HEADER: '.js-annotation__header',
  ALL: '.js-annotation'
};

/**
 * Controller for the annotation directive.
 *
 * @abstract
 * @unrestricted
 */
export default class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * The SVG tail type.
     * @type {TailType}
     * @protected
     */
    this.tailType = TailType.ABSOLUTE;

    /**
     * The current height of the annotation (before starting edit).
     * @type {number}
     * @private
     */
    this.currentHeight_ = EDIT_HEIGHT;

    /**
     * The current width of the annotation (before starting edit).
     * @type {number}
     * @private
     */
    this.currentWidth_ = EDIT_WIDTH;

    /**
     * The current name of the annotation (before starting edit).
     * @type {string}
     * @private
     */
    this.currentName_ = '';

    /**
     * The current description of the annotation (before starting edit).
     * @type {string}
     * @private
     */
    this.currentDescription_ = '';

    /**
     * The annotation name.
     * @type {string}
     */
    this['name'] = '';

    /**
     * The annotation description.
     * @type {string}
     */
    this['description'] = '';

    /**
     * The annotation options.
     * @type {osx.annotation.Options}
     */
    this['options'] = null;

    /**
     * Whether the annotation is being edited inline.
     * @type {boolean}
     */
    this['editingName'] = false;

    /**
     * Whether the annotation is being edited inline.
     * @type {boolean}
     */
    this['editingDescription'] = false;

    dispatcher.getInstance().listen(EventType.LAUNCH_EDIT, this.cancelEdit, false, this);

    $timeout(this.initDragResize.bind(this));
  }

  /**
   * Angular $onDestroy lifecycle function.
   */
  $onDestroy() {
    dispatcher.getInstance().unlisten(EventType.LAUNCH_EDIT, this.cancelEdit, false, this);

    this.element.parent().draggable('destroy');
    this.element.resizable('destroy');

    this.scope = null;
    this.element = null;
  }

  /**
   * Angular $onInit lifecycle function.
   */
  $onInit() {
    this.initOptions();

    if (this.element && this['options']) {
      this.element.width(this['options'].size[0]);
      this.element.height(this['options'].size[1]);

      this.setTailType(TailType.ABSOLUTE);

      // use a conditional delay for the initial tail update in case the view isn't initialized
      var updateDelay = new ConditionalDelay(this.updateTail, this);
      var cleanup = function() {
        dispose(updateDelay);
      };
      updateDelay.onSuccess = updateDelay.onFailure = cleanup;
      updateDelay.start(50, 10000);
    }
  }

  /**
   * Get the annotation options.
   *
   * @abstract
   * @return {osx.annotation.Options} The options.
   * @protected
   */
  getOptions() {}

  /**
   * Initialize the annotation options.
   * @protected
   */
  initOptions() {
    this['options'] = this.getOptions();

    if (this['options']) {
      // if background color isnt set, set it to current default themes
      this['options'].bodyBG = this['options'].bodyBG || undefined;
      this['options'].headerBG = this['options'].headerBG || undefined;
    }
  }

  /**
   * Initialize the drag/resize handlers.
   *
   * @protected
   */
  initDragResize() {
    if (this.element) {
      if (this.element.parent().length) {
        // OpenLayers absolutely positions the parent container, so attach the draggable handler to that and use the
        // annotation container as the drag target.
        this.element.parent().draggable({
          'containment': this.getContainerSelector(),
          'handle': selectors.ALL,
          'start': this.onDragStart_.bind(this),
          'drag': this.updateTail.bind(this),
          'stop': this.onDragStop_.bind(this),
          'scroll': false
        });
      }

      this.element.resizable({
        'containment': this.getContainerSelector(),
        'minWidth': 50,
        'maxWidth': 800,
        'minHeight': 25,
        'maxHeight': 800,
        'handles': 'se',
        'start': this.onDragStart_.bind(this),
        'resize': this.updateTail.bind(this),
        'stop': this.onDragStop_.bind(this),
        'autoHide': true
      });
    }
  }

  /**
   * Get the selector for the annotation container.
   *
   * @return {string} The selector.
   * @protected
   */
  getContainerSelector() {
    return '#map-container';
  }

  /**
   * Launches the full annotation edit window.
   *
   * @abstract
   * @export
   */
  launchEditWindow() {}

  /**
   * Hide the annotation.
   *
   * @abstract
   * @export
   */
  hideAnnotation() {}

  /**
   * Edit the annotation description inline.
   *
   * @export
   */
  editDescription() {
    if (this['options'].editable && !this['editingDescription']) {
      this['editingDescription'] = true;
      this.element.parent().draggable('option', 'handle', selectors.HEADER);

      this.recordCurrents_();

      if (this.currentHeight_ < EDIT_HEIGHT || this.currentWidth_ < EDIT_WIDTH) {
        // the annotation is too small to edit visually, so expand it
        this.element.height(EDIT_HEIGHT);
        this.element.width(EDIT_WIDTH);
      }

      this.updateTail();
    }
  }

  /**
   * Edit the annotation name inline.
   *
   * @export
   */
  editName() {
    if (this['options'].editable && !this['editingName']) {
      this['editingName'] = true;

      this.recordCurrents_();

      if (this.currentWidth_ < EDIT_WIDTH) {
        // the annotation is too small to edit visually, so expand it
        this.element.width(EDIT_WIDTH - 100);
      }

      this.updateTail();
    }
  }

  /**
   * Records the current values during inline edit. These are restored if the user cancels the edit.
   *
   * @export
   */
  recordCurrents_() {
    this.currentHeight_ = this.element.height();
    this.currentWidth_ = this.element.width();
    this.currentName_ = this['name'];
    this.currentDescription_ = this['description'];
  }

  /**
   * Save the changes to the annotation.
   *
   * @export
   */
  saveAnnotation() {
    // reset the values to the old ones
    this.element.height(this.currentHeight_);
    this.element.width(this.currentWidth_);
    this['options'].size = [this.currentWidth_, this.currentHeight_];

    if (this['editingDescription']) {
      this.element.parent().draggable('option', 'handle', selectors.ALL);
    }

    this['editingName'] = false;
    this['editingDescription'] = false;

    this.element.parent().draggable('option', 'handle', selectors.ALL);
    this.updateTail();
  }

  /**
   * Cancel editing the annotation.
   *
   * @export
   */
  cancelEdit() {
    if (this.element) {
      if (this['editingDescription'] || this['editingName']) {
        // reset the values to the old ones
        this.element.height(this.currentHeight_);
        this.element.width(this.currentWidth_);
        this['options'].size = [this.currentWidth_, this.currentHeight_];

        this['name'] = this.currentName_;
        this['description'] = this.currentDescription_;

        this.updateTail();

        if (this['editingDescription']) {
          this.element.parent().draggable('option', 'handle', selectors.ALL);
        }
      }

      this['editingName'] = false;
      this['editingDescription'] = false;
    }
  }

  /**
   * Handle drag start event.
   *
   * @param {Object} event The drag event.
   * @param {Object} ui The draggable UI object.
   * @private
   */
  onDragStart_(event, ui) {
    // use fixed positioning during drag/resize for smoother SVG updates
    this.setTailType(TailType.FIXED);
    this.updateTail();
  }

  /**
   * Handle drag stop event.
   *
   * @param {Object} event The drag event.
   * @param {Object} ui The draggable UI object.
   * @private
   */
  onDragStop_(event, ui) {
    // use absolute positioning when drag/resize stops for smoother repositioning on interaction
    this.setTailType(TailType.ABSOLUTE);
    this.userChanged_ = true;
    this.updateTail();
  }

  /**
   * Set the SVG tail type.
   *
   * @param {TailType} type The type.
   * @protected
   */
  setTailType(type) {
    this.tailType = type;
  }

  /**
   * Get the pixel for the provided coordinate.
   *
   * @abstract
   * @param {Array<number>} coordinate The coordinate.
   * @return {Array<number>|undefined} The pixel for the provided coordinate.
   * @protected
   */
  getTargetPixel(coordinate) {}

  /**
   * Update the SVG tail for the annotation.
   *
   * @return {boolean}
   * @protected
   */
  updateTail() {
    return this.tailType === TailType.ABSOLUTE ?
      this.updateTailAbsolute() :
      this.updateTailFixed();
  }

  /**
   * Update the SVG tail for the annotation using an absolute position.
   *
   * @abstract
   * @return {boolean} If the update was successful.
   * @protected
   */
  updateTailAbsolute() {}

  /**
   * Update the SVG tail for the annotation using fixed position.
   *
   * @abstract
   * @return {boolean} If the update was successful.
   * @protected
   */
  updateTailFixed() {}

  /**
   * Delays the function call.
   * @param {*} time The time to delay in milliseconds
   * @return {Promise} The promise for the delay.
   */
  delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  /**
   * Sets the focus of the name text box.
   */
  setFocus() {
    this.delay(250).then(() => {
      const placeNameText = window.document.getElementById('placeName');
      placeNameText.focus();
    });
  }

  /**
   * Sets the focus of the description text box.
   */
  setFocusDesc() {
    this.delay(250).then(() => {
      const htmlCollection = window.document.getElementsByClassName('tui-editor-contents');
      if (htmlCollection && htmlCollection.length > 0) {
        for (let i = 0; i < htmlCollection.length; i++) {
          const editor = htmlCollection[i];
          if (editor.childElementCount > 0) {
            editor.focus();
            break;
          }
        }
      }
    });
  }

  /**
   * Generate the SVG tail path for an annotation.
   *
   * @param {!Array<number>} center The annotation center coordinate, in pixels.
   * @param {!Array<number>} target The annotation target coordinate, in pixels.
   * @param {number} radius The anchor line radius, in pixels.
   * @param {string=} opt_tailStyle Optional tail style.
   * @return {string} The SVG tail path.
   * @protected
   */
  static createTailPath(center, target, radius, opt_tailStyle) {
    if (opt_tailStyle == TailStyle.NOTAIL) {
      return '';
    }

    if (opt_tailStyle == TailStyle.LINETAIL) {
      return 'M' + center[0] + ' ' + center[1] + ' L' + target[0] + ' ' + target[1];
    }

    var anchor1 = Controller.rotateAnchor(center, target, radius);
    var anchor2 = Controller.rotateAnchor(center, target, -radius);

    return 'M' + anchor1[0] + ' ' + anchor1[1] +
        ' L' + target[0] + ' ' + target[1] +
        ' L' + anchor2[0] + ' ' + anchor2[1];
  }

  /**
   * Rotate a tail anchor position around the annotation center. This is used to create an anchor line that is
   * perpendicular to the line from center to target.
   *
   * @param {!Array<number>} center The annotation center coordinate, in pixels.
   * @param {!Array<number>} target The annotation target coordinate, in pixels.
   * @param {number} x The x offset from center.
   * @return {!Array<number>} The rotated pixel coordinate.
   * @protected
   */
  static rotateAnchor(center, target, x) {
    var angle = Math.atan2(center[1] - target[1], center[0] - target[0]) + Math.PI / 2;
    var anchor = [
      x * Math.cos(angle) + center[0],
      x * Math.sin(angle) + center[1]
    ];

    return anchor;
  }
}
