goog.provide('plugin.audio.AudioFileTypeMethod');

goog.require('os.file.IContentTypeMethod');



/**
 * Type method for audio files
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
plugin.audio.AudioFileTypeMethod = function() {};


/**
 * @inheritDoc
 */
plugin.audio.AudioFileTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @type {RegExp}
 * @const
 */
plugin.audio.AudioFileTypeMethod.EXT_REGEXP = /\.(mp3|wav|ogg|m4a)$/i;


/**
 * @inheritDoc
 */
plugin.audio.AudioFileTypeMethod.prototype.getContentType = function() {
  return 'audio';
};


/**
 * @inheritDoc
 */
plugin.audio.AudioFileTypeMethod.prototype.getLayerType = function() {
  return 'audio';
};


/**
 * @inheritDoc
 */
plugin.audio.AudioFileTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var fileName = file.getFileName();

  if (!opt_zipEntries) {
    if (fileName.match(plugin.audio.AudioFileTypeMethod.EXT_REGEXP)) {
      return true;
    }

    // todo: mimetype matching
  }

  return false;
};
