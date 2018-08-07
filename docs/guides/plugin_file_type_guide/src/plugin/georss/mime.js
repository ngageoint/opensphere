goog.provide('plugin.georss.mime');

goog.require('os.file.mime');
goog.require('os.file.mime.xml');


/**
 * @type {string}
 * @const
 */
plugin.georss.mime.TYPE = 'application/rss+xml+geo';


os.file.mime.register(
    // the type for this detection
    plugin.georss.mime.TYPE,
    // os.file.mime.xml provides a function that creates a detection function for a
    // given root tag regex and xmlns regex
    os.file.mime.xml.createDetect(/^feed$/, /^http:\/\/www.w3.org\/2005\/Atom$/),
    // the priority of this detection. 0 is the default, lower numbers run earlier
    0,
    // the parent type; XML in this case
    os.file.mime.xml.TYPE);
