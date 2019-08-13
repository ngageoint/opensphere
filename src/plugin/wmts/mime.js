goog.provide('plugin.wmts.mime');

goog.require('os.file.mime.xml');
goog.require('plugin.wmts');


os.file.mime.register(
    plugin.wmts.ID,
    os.file.mime.xml.createDetect(/^Capabilities$/, /\/wmts\//),
    0, os.file.mime.xml.TYPE);
