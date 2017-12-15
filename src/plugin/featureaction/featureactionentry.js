goog.provide('plugin.im.action.feature.Entry');

goog.require('os.feature');
goog.require('os.im.action.FilterActionEntry');



/**
 * Filter entry that performs actions on matched features.
 * @extends {os.im.action.FilterActionEntry<ol.Feature>}
 * @constructor
 */
plugin.im.action.feature.Entry = function() {
  plugin.im.action.feature.Entry.base(this, 'constructor');
  this.setTitle('New Feature Action');
  this.filterGetter = os.feature.filterFnGetter;
};
goog.inherits(plugin.im.action.feature.Entry, os.im.action.FilterActionEntry);
