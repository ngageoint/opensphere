goog.provide('os.annotation.AbstractAnnotationCtrl');

goog.require('goog.Disposable');
goog.require('goog.async.ConditionalDelay');
goog.require('os.annotation');
goog.require('os.annotation.TailStyle');
goog.require('os.annotation.TailType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.Module');
goog.require('os.ui.text.simpleMDEDirective');


/**
 * The annotation template. This must be inline to avoid timing issues between template load and positioning the
 * element on the view.
 * @type {string}
 * @const
 */
os.annotation.UI_TEMPLATE =
  '<div class="c-annotation u-hover-container">' +
    '<svg class="c-annotation__svg">' +
      '<path ng-style="{ fill: ctrl.options.showDescription ? ctrl.options.bodyBG : ctrl.options.headerBG}" />' +
    '</svg>' +
    '<div class="c-annotation__controls position-absolute text-right w-100" ng-show="ctrl.options.editable">' +
      '<button class="btn btn-sm btn-outline-secondary border-0 bg-transparent animate-fade u-hover-show"' +
          'title="Hide Annotation"' +
          'ng-click="ctrl.hideAnnotation()">' +
        '<i class="fa fa-eye-slash"></i>' +
      '</button>' +
      '<button class="btn btn-sm btn-outline-secondary border-0 bg-transparent animate-fade u-hover-show"' +
          'title="Edit annotation"' +
          'ng-click="ctrl.launchEditWindow()">' +
        '<i class="fa fa-pencil"></i>' +
      '</button>' +
    '</div>' +
    '<div class="js-annotation c-window card h-100">' +
      '<div class="card-header flex-shrink-0 text-truncate px-1 py-0" title="{{ctrl.name}}"' +
          'ng-show="ctrl.options.showName" ' +
          'ng-class="!ctrl.options.showDescription && \'h-100 border-0\'" ' +
          'ng-style="{background: ctrl.options.headerBG }" ' +
          'ng-dblclick="ctrl.editName()">' +
        '<div ng-show="!ctrl.editingName">{{ctrl.name}}</div>' +
        '<div class="form-row p-1" ng-if="ctrl.editingName">' +
          '<div class="col">' +
            '<input class="form-control" type="text" ng-model="ctrl.name"/>' +
          '</div>' +
          '<div class="col-auto">' +
            '<button class="btn btn-success mr-1" title="Save the annotation" ' +
                'ng-click="ctrl.saveAnnotation()" ' +
                'ng-disabled="!ctrl.name">' +
              '<i class="fa fa-check"/> OK' +
            '</button>' +
            '<button class="btn btn-secondary" title="Cancel editing the annotation" ng-click="ctrl.cancelEdit()">' +
              '<i class="fa fa-ban"/> Cancel' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card-body p-1 u-overflow-y-auto" ng-show="ctrl.options.showDescription" ' +
          'ng-style="{background: ctrl.options.bodyBG }" ' +
          'ng-dblclick="ctrl.editDescription()">' +
        '<simplemde text="ctrl.description" edit="ctrl.editingDescription" is-required="false" maxlength="4000">' +
        '</simplemde>' +
        '<div class="float-right" ng-if="ctrl.editingDescription">' +
          '<button class="btn btn-success mr-1" title="Save the annotation" ng-click="ctrl.saveAnnotation()">' +
            '<i class="fa fa-check"/> OK' +
          '</button>' +
          '<button class="btn btn-secondary" title="Cancel editing the annotation" ng-click="ctrl.cancelEdit()">' +
            '<i class="fa fa-ban"/> Cancel' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';



/**
 * Controller for the annotation directive.
 * @abstract
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.annotation.AbstractAnnotationCtrl = function($scope, $element, $timeout) {
  os.annotation.AbstractAnnotationCtrl.base(this, 'constructor');

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
   * @type {os.annotation.TailType}
   * @protected
   */
  this.tailType = os.annotation.TailType.ABSOLUTE;

  /**
   * The current height of the annotation (before starting edit).
   * @type {number}
   * @private
   */
  this.currentHeight_ = os.annotation.EDIT_HEIGHT;

  /**
   * The current width of the annotation (before starting edit).
   * @type {number}
   * @private
   */
  this.currentWidth_ = os.annotation.EDIT_WIDTH;

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
   * @type {!osx.annotation.Options}
   */
  this['options'] = this.getOptions();

  // if background color isnt set, set it to current default themes
  this['options'].bodyBG = this['options'].bodyBG || undefined;
  this['options'].headerBG = this['options'].headerBG || undefined;

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

  os.dispatcher.listen(os.annotation.EventType.LAUNCH_EDIT, this.cancelEdit, false, this);

  this.initialize();
  $timeout(this.initDragResize.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.annotation.AbstractAnnotationCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.annotation.AbstractAnnotationCtrl.prototype.disposeInternal = function() {
  os.annotation.AbstractAnnotationCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * Get the annotation options.
 * @abstract
 * @return {osx.annotation.Options} The options.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.getOptions = function() {};


/**
 * Initialize the annotation.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.initialize = function() {
  if (this.element) {
    this.element.width(this['options'].size[0]);
    this.element.height(this['options'].size[1]);

    this.setTailType(os.annotation.TailType.ABSOLUTE);

    // use a conditional delay for the initial tail update in case the view isn't initialized
    var updateDelay = new goog.async.ConditionalDelay(this.updateTail, this);
    var cleanup = function() {
      goog.dispose(updateDelay);
    };
    updateDelay.onSuccess = updateDelay.onFailure = cleanup;
    updateDelay.start(50, 10000);
  }
};


/**
 * Initialize the drag/resize handlers.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.initDragResize = function() {
  if (this.element && this.element.parent().length) {
    // OpenLayers absolutely positions the parent container, so attach the draggable handler to that and use the
    // annotation container as the drag target.
    this.element.parent().draggable({
      'containment': this.getContainerSelector(),
      'handle': '.js-annotation',
      'start': this.onDragStart_.bind(this),
      'drag': this.updateTail.bind(this),
      'stop': this.onDragStop_.bind(this),
      'scroll': false
    });

    this.element.resizable({
      'containment': this.getContainerSelector(),
      'minWidth': 50,
      'maxWidth': 800,
      'minHeight': 25,
      'maxHeight': 800,
      'handles': 'se',
      'start': this.onDragStart_.bind(this),
      'resize': this.updateTail.bind(this),
      'stop': this.onDragStop_.bind(this)
    });
  }
};


/**
 * Get the selector for the annotation container.
 * @return {string} The selector.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.getContainerSelector = function() {
  return '#map-container';
};


/**
 * Launches the full annotation edit window.
 * @abstract
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.launchEditWindow = function() {};


/**
 * Hide the annotation.
 * @abstract
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.hideAnnotation = function() {};


/**
 * Edit the annotation description inline.
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.editDescription = function() {
  if (this['options'].editable && !this['editingDescription']) {
    this['editingDescription'] = true;

    this.recordCurrents_();

    if (this.currentHeight_ < os.annotation.EDIT_HEIGHT || this.currentWidth_ < os.annotation.EDIT_WIDTH) {
      // the annotation is too small to edit visually, so expand it
      this.element.height(os.annotation.EDIT_HEIGHT);
      this.element.width(os.annotation.EDIT_WIDTH);
    }

    this.updateTail();
  }
};


/**
 * Edit the annotation name inline.
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.editName = function() {
  if (this['options'].editable && !this['editingName']) {
    this['editingName'] = true;

    this.recordCurrents_();

    if (this.currentWidth_ < os.annotation.EDIT_WIDTH) {
      // the annotation is too small to edit visually, so expand it
      this.element.width(os.annotation.EDIT_WIDTH - 100);
    }

    this.updateTail();
  }
};


/**
 * Records the current values during inline edit. These are restored if the user cancels the edit.
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.recordCurrents_ = function() {
  this.currentHeight_ = this.element.height();
  this.currentWidth_ = this.element.width();
  this.currentName_ = this['name'];
  this.currentDescription_ = this['description'];
};


/**
 * Save the changes to the annotation.
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.saveAnnotation = function() {
  // reset the values to the old ones
  this.element.height(this.currentHeight_);
  this.element.width(this.currentWidth_);
  this['options'].size = [this.currentWidth_, this.currentHeight_];

  this['editingName'] = false;
  this['editingDescription'] = false;

  this.updateTail();
};


/**
 * Cancel editing the annotation.
 * @export
 */
os.annotation.AbstractAnnotationCtrl.prototype.cancelEdit = function() {
  if (this['editingDescription'] || this['editingName']) {
    // reset the values to the old ones
    this.element.height(this.currentHeight_);
    this.element.width(this.currentWidth_);
    this['options'].size = [this.currentWidth_, this.currentHeight_];

    this['name'] = this.currentName_;
    this['description'] = this.currentDescription_;

    this.updateTail();
  }

  this['editingName'] = false;
  this['editingDescription'] = false;
};


/**
 * Handle drag start event.
 * @param {Object} event The drag event.
 * @param {Object} ui The draggable UI object.
 * @private
 */
os.annotation.AbstractAnnotationCtrl.prototype.onDragStart_ = function(event, ui) {
  // use fixed positioning during drag/resize for smoother SVG updates
  this.setTailType(os.annotation.TailType.FIXED);
  this.updateTail();
};


/**
 * Handle drag stop event.
 * @param {Object} event The drag event.
 * @param {Object} ui The draggable UI object.
 * @private
 */
os.annotation.AbstractAnnotationCtrl.prototype.onDragStop_ = function(event, ui) {
  // use absolute positioning when drag/resize stops for smoother repositioning on interaction
  this.setTailType(os.annotation.TailType.ABSOLUTE);
  this.userChanged_ = true;
  this.updateTail();
};


/**
 * Set the SVG tail type.
 * @param {os.annotation.TailType} type The type.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.setTailType = function(type) {
  this.tailType = type;
};


/**
 * Get the pixel for the provided coordinate.
 * @abstract
 * @param {Array<number>} coordinate The coordinate.
 * @return {Array<number>|undefined} The pixel for the provided coordinate.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.getTargetPixel = function(coordinate) {};


/**
 * Update the SVG tail for the annotation.
 * @return {boolean}
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.updateTail = function() {
  return this.tailType === os.annotation.TailType.ABSOLUTE ?
    this.updateTailAbsolute() :
    this.updateTailFixed();
};


/**
 * Update the SVG tail for the annotation using an absolute position.
 * @abstract
 * @return {boolean} If the update was successful.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.updateTailAbsolute = function() {};


/**
 * Update the SVG tail for the annotation using fixed position.
 * @abstract
 * @return {boolean} If the update was successful.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.prototype.updateTailFixed = function() {};


/**
 * Generate the SVG tail path for an annotation.
 * @param {!Array<number>} center The annotation center coordinate, in pixels.
 * @param {!Array<number>} target The annotation target coordinate, in pixels.
 * @param {number} radius The anchor line radius, in pixels.
 * @return {string} The SVG tail path.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.createTailPath = function(center, target, radius) {
  var anchor1 = os.annotation.AbstractAnnotationCtrl.rotateAnchor(center, target, radius);
  var anchor2 = os.annotation.AbstractAnnotationCtrl.rotateAnchor(center, target, -radius);

  return 'M' + anchor1[0] + ' ' + anchor1[1] +
      ' L' + target[0] + ' ' + target[1] +
      ' L' + anchor2[0] + ' ' + anchor2[1];
};


/**
 * Rotate a tail anchor position around the annotation center. This is used to create an anchor line that is
 * perpendicular to the line from center to target.
 * @param {!Array<number>} center The annotation center coordinate, in pixels.
 * @param {!Array<number>} target The annotation target coordinate, in pixels.
 * @param {number} x The x offset from center.
 * @return {!Array<number>} The rotated pixel coordinate.
 * @protected
 */
os.annotation.AbstractAnnotationCtrl.rotateAnchor = function(center, target, x) {
  var angle = Math.atan2(center[1] - target[1], center[0] - target[0]) + Math.PI / 2;
  var anchor = [
    x * Math.cos(angle) + center[0],
    x * Math.sin(angle) + center[1]
  ];

  return anchor;
};
