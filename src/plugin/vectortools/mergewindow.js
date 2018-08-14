goog.provide('plugin.vectortools.MergeCtrl');
goog.provide('plugin.vectortools.mergeDirective');

goog.require('os.data.OSDataManager');
goog.require('os.data.SourceManager');
goog.require('os.defines');
goog.require('os.source.PropertyChange');
goog.require('os.ui.Module');
goog.require('os.ui.window');
goog.require('plugin.vectortools.MergeLayer');
goog.require('plugin.vectortools.mappingCounterDirective');


/**
 * @return {angular.Directive}
 */
plugin.vectortools.mergeDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/vectortools/merge.html',
    controller: plugin.vectortools.MergeCtrl,
    controllerAs: 'ctrl'
  };
};


// add the directive to the module
os.ui.Module.directive('merge', [plugin.vectortools.mergeDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.data.SourceManager}
 * @constructor
 * @ngInject
 */
plugin.vectortools.MergeCtrl = function($scope, $element) {
  plugin.vectortools.MergeCtrl.base(this, 'constructor');

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
  this['name'] = 'New Layer';

  /**
   * @type {string}
   */
  this['featureCountText'] = '';

  this.init();

  $scope.$on('$destroy', this.disposeInternal.bind(this));
  $scope.$emit('window.ready');
};
goog.inherits(plugin.vectortools.MergeCtrl, os.data.SourceManager);


/**
 * @inheritDoc
 */
plugin.vectortools.MergeCtrl.prototype.disposeInternal = function() {
  plugin.vectortools.MergeCtrl.base(this, 'disposeInternal');

  this.scope_ = null;
  this.element_ = null;
};


/**
 * @inheritDoc
 */
plugin.vectortools.MergeCtrl.prototype.init = function() {
  plugin.vectortools.MergeCtrl.base(this, 'init');
  /** @type {angular.$timeout} */ (os.ui.injector.get('$timeout'))(this.onUpdateDelay.bind(this));
};


/**
 * @inheritDoc
 */
plugin.vectortools.MergeCtrl.prototype.removeSource = function(source) {
  plugin.vectortools.MergeCtrl.base(this, 'removeSource', source);

  goog.array.remove(this.sourceIds_, source.getId());
  this.onUpdateDelay();
};


/**
 * @inheritDoc
 */
plugin.vectortools.MergeCtrl.prototype.onSourcePropertyChange = function(event) {
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
plugin.vectortools.MergeCtrl.prototype.onUpdateDelay = function() {
  this.scope_['mergeForm'].$setValidity('featureCount', true);
  this['count'] = 0;

  for (var i = 0, ii = this.sourceIds_.length; i < ii; i++) {
    var source = os.osDataManager.getSource(this.sourceIds_[i]);
    if (source) {
      this['count'] += source.getFeatures().length;
    }
  }

  if (this['count'] === 0) {
    this.scope_['mergeForm'].$setValidity('featureCount', false);
    this['popoverText'] = 'Nothing to merge.';
    this['popoverTitle'] = 'No Features';
    this['featureCountText'] = 'Nothing to merge.';
  } else if (2 * this['count'] > os.ogc.getMaxFeatures()) {
    this.scope_['mergeForm'].$setValidity('featureCount', false);
    this['popoverText'] = 'Too many features!';
    this['popoverTitle'] = 'Too Many Features';
    this['featureCountText'] = 'This merge would result in too many features for {APP} to handle. Reduce the number ' +
        'of features you are merging and try again.';
  }

  os.ui.apply(this.scope_);
};


/**
 * Close dialog
 */
plugin.vectortools.MergeCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(plugin.vectortools.MergeCtrl.prototype, 'close', plugin.vectortools.MergeCtrl.prototype.close);


/**
 * Adds the command to perform the merge.
 */
plugin.vectortools.MergeCtrl.prototype.accept = function() {
  var merge = new plugin.vectortools.MergeLayer(this.sourceIds_, this['name']);
  os.command.CommandProcessor.getInstance().addCommand(merge);
  this.close();
};
goog.exportProperty(plugin.vectortools.MergeCtrl.prototype, 'accept', plugin.vectortools.MergeCtrl.prototype.accept);
