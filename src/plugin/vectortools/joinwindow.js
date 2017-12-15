goog.provide('plugin.vectortools.JoinCtrl');
goog.provide('plugin.vectortools.joinDirective');

goog.require('os.data.OSDataManager');
goog.require('os.data.SourceManager');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.window');
goog.require('plugin.vectortools.JoinLayer');
goog.require('plugin.vectortools.mappingCounterDirective');


/**
 * @return {angular.Directive}
 */
plugin.vectortools.joinDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/vectortools/join.html',
    controller: plugin.vectortools.JoinCtrl,
    controllerAs: 'ctrl'
  };
};


// add the directive to the module
os.ui.Module.directive('join', [plugin.vectortools.joinDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.data.SourceManager}
 * @constructor
 * @ngInject
 */
plugin.vectortools.JoinCtrl = function($scope, $element) {
  plugin.vectortools.JoinCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {!Array<string>}
   * @private
   */
  this.sourceIds_ = $scope['sourceIds'];

  /**
   * @type {string}
   */
  this['name'] = 'Joined Layer';

  /**
   * @type {string}
   */
  this['joinMethod'] = 'unique';

  /**
   * @type {string}
   */
  this['chooseLayerHelp'] = 'Joining layers compares values in the chosen columns for each layer against the ' +
      'Primary Layer and combines features whose values match. If the values match, the feature from the other ' +
      'layer will be merged into the matching features in the Primary Layer.';

  /**
   * @type {string}
   */
  this['joinMethodHelp'] = 'The Join Method determines how we compare values between columns.' +
      '<ul><li> Exact Match: Joins two features when the value is exactly the same on both.</li>' +
      '<li> Contains: Joins two features when one value contains the other.</li>';

  /**
   * @type {Array<Object>}
   */
  this['joinSources'] = this.sourceIds_
      .map(plugin.vectortools.JoinCtrl.mapSources)
      .sort(plugin.vectortools.JoinCtrl.sortSources_);

  /**
   * @type {?string}
   */
  this['primarySource'] = this['joinSources'][0]['id'];

  this.init();
  $scope.$on('$destroy', this.disposeInternal.bind(this));
  $scope.$emit('window.ready');
};
goog.inherits(plugin.vectortools.JoinCtrl, os.data.SourceManager);


/**
 * @inheritDoc
 */
plugin.vectortools.JoinCtrl.prototype.disposeInternal = function() {
  plugin.vectortools.JoinCtrl.base(this, 'disposeInternal');

  this.scope_ = null;
  this.element_ = null;
};


/**
 * @inheritDoc
 */
plugin.vectortools.JoinCtrl.prototype.init = function() {
  plugin.vectortools.JoinCtrl.base(this, 'init');
  /** @type {angular.$timeout} */ (os.ui.injector.get('$timeout'))(this.onUpdateDelay.bind(this));
};


/**
 * @inheritDoc
 */
plugin.vectortools.JoinCtrl.prototype.removeSource = function(source) {
  plugin.vectortools.JoinCtrl.base(this, 'removeSource', source);
  goog.array.remove(this.sourceIds_, source.getId());
  this.onUpdateDelay();
};


/**
 * @inheritDoc
 */
plugin.vectortools.JoinCtrl.prototype.onSourcePropertyChange = function(event) {
  var p;
  try {
    p = event.getProperty();
  } catch (e) {
    return;
  }

  if (p === os.source.PropertyChange.FEATURES) {
    this.onUpdateDelay();
  }
};


/**
 * @inheritDoc
 */
plugin.vectortools.JoinCtrl.prototype.onUpdateDelay = function() {
  this.scope_['joinForm'].$setValidity('featureCount', true);
  this['count'] = 0;

  for (var i = 0, ii = this.sourceIds_.length; i < ii; i++) {
    var source = os.osDataManager.getSource(this.sourceIds_[i]);
    if (source) {
      this['count'] += source.getFeatures().length;
    }
  }

  if (this['count'] === 0) {
    this.scope_['joinForm'].$setValidity('featureCount', false);
    this['popoverText'] = 'Nothing to join.';
    this['popoverTitle'] = 'No Features';
    this['featureCountText'] = 'Nothing to join.';
  } else if (2 * this['count'] > os.ogc.getMaxFeatures()) {
    this.scope_['joinForm'].$setValidity('featureCount', false);
    this['popoverText'] = 'Too many features!';
    this['popoverTitle'] = 'Too Many Features';
    this['featureCountText'] = 'This join would result in too many features for {APP} to handle. Reduce the number ' +
        'of features you are joining and try again.';
  }

  os.ui.apply(this.scope_);
};


/**
 * Close the window.
 */
plugin.vectortools.JoinCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(plugin.vectortools.JoinCtrl.prototype, 'close', plugin.vectortools.JoinCtrl.prototype.close);


/**
 * Builds and executes the command to perform the join then closes the window.
 */
plugin.vectortools.JoinCtrl.prototype.accept = function() {
  var sources = this['joinSources'].map(function(item) {
    return item['id'];
  });

  var columns = this['joinSources'].map(function(item) {
    return item['joinColumn']['field'];
  });

  // put the primary source at index 0
  var primary = /** @type {string} */ (this['primarySource']);
  var i = sources.indexOf(primary);

  var tmp = sources.splice(i, 1);
  sources = tmp.concat(sources);

  tmp = columns.splice(i, 1);
  columns = tmp.concat(columns);

  var cmd = new plugin.vectortools.JoinLayer(
      /** @type {!Array<string>} */ (sources),
      /** @type {!Array<string>} */ (columns),
      this['joinMethod'],
      this['name']);

  os.command.CommandProcessor.getInstance().addCommand(cmd);
  this.close();
};
goog.exportProperty(plugin.vectortools.JoinCtrl.prototype, 'accept', plugin.vectortools.JoinCtrl.prototype.accept);


/**
 * @param {string} id
 * @return {Object}
 * @protected
 */
plugin.vectortools.JoinCtrl.mapSources = function(id) {
  var source = os.osDataManager.getSource(id);

  return {
    'id': source.getId(),
    'title': source.getTitle(),
    'cols': source.getColumns().sort(plugin.vectortools.JoinCtrl.sortByName_)
  };
};


/**
 * @param {os.data.ColumnDefinition} a
 * @param {os.data.ColumnDefinition} b
 * @return {number}
 * @private
 */
plugin.vectortools.JoinCtrl.sortByName_ = function(a, b) {
  return goog.string.numerateCompare(a['name'], b['name']);
};


/**
 * @param {Object} a
 * @param {Object} b
 * @return {number}
 * @private
 */
plugin.vectortools.JoinCtrl.sortSources_ = function(a, b) {
  return goog.string.numerateCompare(a['title'], b['title']);
};
