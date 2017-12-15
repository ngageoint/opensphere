goog.provide('os.command.ExclusionQueryClear');
goog.require('os.command.QueryClear');



/**
 * Command to add a exclusion query to the map.
 * @extends {os.command.QueryClear}
 * @constructor
 */
os.command.ExclusionQueryClear = function() {
  os.command.ExclusionQueryClear.base(this, 'constructor');
  this.value = false;
};
goog.inherits(os.command.ExclusionQueryClear, os.command.QueryClear);


/**
 * @inheritDoc
 */
os.command.ExclusionQueryClear.prototype.title = 'Clear exclusion areas';
