goog.provide('os.style.ImageReader');

goog.require('goog.object');
goog.require('os.style.AbstractReader');
goog.require('os.style.IStyleReader');



/**
 * Image style reader
 * @extends {os.style.AbstractReader.<T>}
 * @constructor
 * @template T
 */
os.style.ImageReader = function() {
  os.style.ImageReader.base(this, 'constructor');
};
goog.inherits(os.style.ImageReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.ImageReader.prototype.getOrCreateStyle = function(configs, opt_keys) {
  opt_keys = opt_keys || [];
  opt_keys.push('type');
  var type = /** @type {string|undefined} */ (os.style.getValue(opt_keys, configs)) || 'circle';
  opt_keys.pop();
  return this.readers[type].getOrCreateStyle(configs, opt_keys);
};


/**
 * @inheritDoc
 */
os.style.ImageReader.prototype.toConfig = function(style, obj) {
  if (style instanceof ol.style.Image) {
    var child = {};
    obj['image'] = child;

    for (var key in this.readers) {
      this.readers[key].toConfig(style, child);
    }
  }
};


/**
 * @inheritDoc
 */
os.style.ImageReader.prototype.setReaders = function(readers) {
  if (readers) {
    var newReaders = goog.object.clone(readers);
    delete newReaders['image'];
    readers = newReaders;
  }

  os.style.ImageReader.base(this, 'setReaders', readers);
};
