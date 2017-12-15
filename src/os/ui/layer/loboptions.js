goog.provide('os.ui.layer.LobOptionsCtrl');
goog.provide('os.ui.layer.lobOptionsDirective');
goog.require('goog.async.Delay');
goog.require('os.command.VectorLayerArrowSize');
goog.require('os.command.VectorLayerBearing');
goog.require('os.command.VectorLayerBearingError');
goog.require('os.command.VectorLayerBearingErrorColumn');
goog.require('os.command.VectorLayerLOBError');
goog.require('os.command.VectorLayerLOBLength');
goog.require('os.command.VectorLayerLOBLengthError');
goog.require('os.command.VectorLayerLOBMultiplier');
goog.require('os.command.VectorLayerShowArrow');
goog.require('os.command.VectorLayerShowEllipse');
goog.require('os.command.VectorLayerShowError');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.layer.AbstractLayerUICtrl');


/**
 * The lob options directive.
 * @return {angular.Directive}
 */
os.ui.layer.lobOptionsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/layer/loboptions.html',
    controller: os.ui.layer.LobOptionsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('loboptions', [os.ui.layer.lobOptionsDirective]);



/**
 * Controller function for the loboptions directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.layer.AbstractLayerUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.layer.LobOptionsCtrl = function($scope, $element) {
  os.ui.layer.LobOptionsCtrl.base(this, 'constructor', $scope, $element);

  /**
   * The Show Arrow checkbox state.
   * @type {boolean}
   */
  this['showArrow'] = false;

  /**
   * The Show Error checkbox state.
   * @type {boolean}
   */
  this['showError'] = false;

  /**
   * The Show ellipse checkbox state.
   * @type {boolean}
   */
  this['showEllipse'] = false;

  /**
   * The column used for the length multiplier
   * @type {string}
   */
  this['lengthColumn'] = '';

  /**
   * The column used for the length error
   * @type {string}
   */
  this['lengthErrorColumn'] = '';

  /**
   * The column used for the bearing
   * @type {string}
   */
  this['bearingColumn'] = '';

  /**
   * The column used for the bearing error
   * @type {string}
   */
  this['bearingErrorColumn'] = '';

  this.scope['length'] = os.style.DEFAULT_LOB_LENGTH;
  this.scope['size'] = os.style.DEFAULT_ARROW_SIZE;
  this.scope['lengthErrorMultiplier'] = os.style.DEFAULT_LOB_LENGTH_ERROR;
  this.scope['bearingErrorMultiplier'] = os.style.DEFAULT_LOB_BEARING_ERROR;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.lengthDelay_ = new goog.async.Delay(this.onLengthDelay_, 1000, this);


  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.lengthErrorDelay_ = new goog.async.Delay(this.onLengthErrorDelay_, 1000, this);


  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.bearingErrorDelay_ = new goog.async.Delay(this.onBearingErrorDelay_, 1000, this);

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.sizeDelay_ = new goog.async.Delay(this.onSizeDelay_, 1000, this);

  /**
   * @type {string}
   */
  this['helpText'] = '<p>Line of Bearing Error allows you to show a +/- error range on the line length and ' +
    'orientation with arcs. Absence of bearing error shows lines instead of arcs. Absence of length error shows a ' +
    'single arc.</p><img src="' + os.ROOT + '/images/loberror.png"></img>';
};
goog.inherits(os.ui.layer.LobOptionsCtrl, os.ui.layer.AbstractLayerUICtrl);


/**
 * @inheritDoc
 */
os.ui.layer.LobOptionsCtrl.prototype.initUI = function() {
  os.ui.layer.LobOptionsCtrl.base(this, 'initUI');

  if (!this.isDisposed()) {
    this['columns'] = this.getValue(os.ui.layer.getColumns);
    this['showArrow'] = this.getShowArrow_();
    this['showError'] = this.getShowError_();
    this['showEllipse'] = this.getShowEllipse_();
    this['lengthColumn'] = this.getLengthColumn_();
    this['lengthErrorColumn'] = this.getLengthErrorColumn_();
    this['bearingColumn'] = this.getBearingColumn_();
    this['bearingErrorColumn'] = this.getBearingErrorColumn_();
    this.scope['length'] = this.getLOBLength_();
    this.scope['size'] = this.getSize_();
    this.scope['ellipseSupport'] = this.supportsEllipse();
    this.scope['lengthErrorMultiplier'] = this.getLengthErrorMultiplier_();
    this.scope['bearingErrorMultiplier'] = this.getBearingErrorMultiplier_();
  }
};


/**
 * Checks for ellipse support
 * @return {boolean}
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.supportsEllipse = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  var layer = items[0].getLayer();
  if (layer) {
    var source = /** @type {os.layer.Vector} */ (layer).getSource();
    if (source && os.instanceOf(source, os.source.Vector.NAME)) {
      source = /** @type {!os.source.Vector} */ (source);
      if (!source.hasColumn(os.Fields.RADIUS) &&
          (!source.hasColumn(os.Fields.SEMI_MAJOR) || !source.hasColumn(os.Fields.SEMI_MINOR)) &&
          (!source.hasColumn(os.fields.DEFAULT_SEMI_MAJ_COL_NAME) ||
          !source.hasColumn(os.fields.DEFAULT_SEMI_MIN_COL_NAME))) {
        return false;
      }
      return true;
    }
  }
  return false;
};


/**
 * The lob arrow size
 * @return {number}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getSize_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.ARROW_SIZE];
    }
  }

  return os.style.DEFAULT_ARROW_SIZE;
};


/**
 * The lob length
 * @return {number}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getLOBLength_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_LENGTH];
    }
  }

  return os.style.DEFAULT_LOB_LENGTH;
};


/**
 * The lob length error multipler
 * @return {number}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getLengthErrorMultiplier_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_LENGTH_ERROR];
    }
  }

  return os.style.DEFAULT_LOB_LENGTH_ERROR;
};


/**
 * The lob bearing error multipler
 * @return {number}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getBearingErrorMultiplier_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_BEARING_ERROR];
    }
  }

  return os.style.DEFAULT_LOB_BEARING_ERROR;
};


/**
 * The column for the lob length multiplier
 * @return {string}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getLengthColumn_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_LENGTH_COLUMN];
    }
  }

  return '';
};


/**
 * The column for the lob length error
 * @return {string}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getLengthErrorColumn_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN];
    }
  }

  return '';
};


/**
 * The column for the lob bearing
 * @return {string}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getBearingColumn_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_BEARING_COLUMN];
    }
  }

  return '';
};


/**
 * The column for the lob bearing error
 * @return {string}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getBearingErrorColumn_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return config[os.style.StyleField.LOB_BEARING_ERROR_COLUMN];
    }
  }

  return '';
};


/**
 * If arrow should be displayed for the layer(s).
 * @return {boolean}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getShowArrow_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return !!config[os.style.StyleField.SHOW_ARROW];
    }
  }

  return false;
};


/**
 * If error should be displayed for the layer(s).
 * @return {boolean}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getShowError_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return !!config[os.style.StyleField.SHOW_ERROR];
    }
  }

  return false;
};


/**
 * If ellipse should be displayed for the layer(s).
 * @return {boolean}
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.getShowEllipse_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return !!config[os.style.StyleField.SHOW_ELLIPSE];
    }
  }

  return false;
};


/**
 * Handle changes to the Show Arrow option.
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onShowArrowChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var value = this['showArrow'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowArrow(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onShowArrowChange',
    os.ui.layer.LobOptionsCtrl.prototype.onShowArrowChange);


/**
 * Handle changes to the Show error option.
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onShowErrorChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var value = this['showError'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowError(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onShowErrorChange',
    os.ui.layer.LobOptionsCtrl.prototype.onShowErrorChange);


/**
 * Handle changes to the Show Arrow option.
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onShowEllipseChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var value = this['showEllipse'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowEllipse(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onShowEllipseChange',
    os.ui.layer.LobOptionsCtrl.prototype.onShowEllipseChange);


/**
 * Handles changes to arrow size
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onSizeChange = function(event, value) {
  if (!this.isDisposed()) {
    this.sizeDelay_.start();
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onSizeChange',
    os.ui.layer.LobOptionsCtrl.prototype.onSizeChange);


/**
 * Actually creates the command after the arrow size delay fires
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.onSizeDelay_ = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerArrowSize(layer.getId(), this.scope['size']);
      }, this);

  this.createCommand(fn);
};


/**
 * Handles changes to lob length
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onLengthChange = function(event, value) {
  if (!this.isDisposed()) {
    this.lengthDelay_.start();
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onLengthChange',
    os.ui.layer.LobOptionsCtrl.prototype.onLengthChange);


/**
 * Actually creates the command after the lob length delay fires
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.onLengthDelay_ = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLOBLength(layer.getId(), this.scope['length']);
      }, this);

  this.createCommand(fn);
};


/**
 * Handles changes to bearing error multiplier
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onBearingErrorChange = function(event, value) {
  if (!this.isDisposed()) {
    this.bearingErrorDelay_.start();
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onBearingErrorChange',
    os.ui.layer.LobOptionsCtrl.prototype.onBearingErrorChange);


/**
 * Actually creates the command after the bearing error multiplier delay fires
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.onBearingErrorDelay_ = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerBearingError(layer.getId(), this.scope['bearingErrorMultiplier']);
      }, this);

  this.createCommand(fn);
};


/**
 * Handles changes to bearing error multiplier
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onLengthErrorChange = function(event, value) {
  if (!this.isDisposed()) {
    this.lengthErrorDelay_.start();
  }
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onLengthErrorChange',
    os.ui.layer.LobOptionsCtrl.prototype.onLengthErrorChange);


/**
 * Actually creates the command after the bearing error multiplier delay fires
 * @private
 */
os.ui.layer.LobOptionsCtrl.prototype.onLengthErrorDelay_ = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLOBLengthError(layer.getId(), this.scope['lengthErrorMultiplier']);
      }, this);

  this.createCommand(fn);
};


/**
 * Handles column changes to the lob length multiplier
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onLengthColumnChange = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLOBMultiplier(layer.getId(), this['lengthColumn']);
      }, this);

  this.createCommand(fn);
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onLengthColumnChange',
    os.ui.layer.LobOptionsCtrl.prototype.onLengthColumnChange);


/**
 * Handles column changes to the lob length error
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onLengthErrorColumnChange = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerLOBError(layer.getId(), this['lengthErrorColumn']);
      }, this);

  this.createCommand(fn);
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onLengthErrorColumnChange',
    os.ui.layer.LobOptionsCtrl.prototype.onLengthErrorColumnChange);


/**
 * Handles column changes to the bearing
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onBearingColumnChange = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerBearing(layer.getId(), this['bearingColumn']);
      }, this);

  this.createCommand(fn);
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onBearingColumnChange',
    os.ui.layer.LobOptionsCtrl.prototype.onBearingColumnChange);


/**
 * Handles column changes to the bearing error
 * @protected
 */
os.ui.layer.LobOptionsCtrl.prototype.onBearingErrorColumnChange = function() {
  var fn = goog.bind(
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.VectorLayerBearingErrorColumn(layer.getId(), this['bearingErrorColumn']);
      }, this);

  this.createCommand(fn);
};
goog.exportProperty(
    os.ui.layer.LobOptionsCtrl.prototype,
    'onBearingErrorColumnChange',
    os.ui.layer.LobOptionsCtrl.prototype.onBearingErrorColumnChange);
