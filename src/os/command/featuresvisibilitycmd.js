goog.provide('os.command.FeaturesVisibility');

goog.require('ol.Feature');
goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * @constructor
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractSource}
 * @param {!string} sourceId
 * @param {Array.<ol.Feature>} features
 * @param {boolean} visibility
 */
os.command.FeaturesVisibility = function(sourceId, features, visibility) {
  os.command.FeaturesVisibility.base(this, 'constructor', sourceId);

  /**
   * @type {Array.<ol.Feature>}
   * @protected
   */
  this.features = features;

  var source = this.getSource();
  if (source && this.features) {
    this.title = (visibility ? 'Show ' : 'Hide ') + features.length + ' feature' + (features.length === 1 ? '' : 's') +
        ' on "' + source.getTitle() + '"';
  }

  /**
   * @type {boolean}
   * @protected
   */
  this.visible = visibility;
};
goog.inherits(os.command.FeaturesVisibility, os.command.AbstractSource);


/**
 * @inheritDoc
 */
os.command.FeaturesVisibility.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var source = this.getSource();
    if (source && this.features) {
      if (this.visible) {
        source.showFeatures(this.features);
      } else {
        source.hideFeatures(this.features);
      }

      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.FeaturesVisibility.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var source = this.getSource();
  if (source && this.features) {
    if (!this.visible) {
      source.showFeatures(this.features);
    } else {
      source.hideFeatures(this.features);
    }

    this.state = os.command.State.READY;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.FeaturesVisibility.prototype.canExecute = function() {
  if (!os.command.FeaturesVisibility.superClass_.canExecute.call(this)) {
    return false;
  }

  if (!this.features) {
    this.state = os.command.State.ERROR;
    this.details = 'Features not provided';
    return false;
  }

  return true;
};
