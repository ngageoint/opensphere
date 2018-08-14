goog.provide('os.data.MockProvider');
goog.require('os.ui.data.BaseProvider');


os.data.MockProvider = function() {
  goog.base(this);
};
goog.inherits(os.data.MockProvider, os.ui.data.BaseProvider);


os.data.MockProvider.prototype.configure = function(config) {
  this.test = config['test'];
};

os.data.MockProvider.prototype.load = function(ping) {
  this.loaded = true;
};
