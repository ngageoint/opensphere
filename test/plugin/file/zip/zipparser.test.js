goog.require('ol.geom.Point');
goog.require('os.events.EventType');
goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('os.im.Importer');
goog.require('os.mixin');
goog.require('os.mock');
goog.require('os.net.Request');
goog.require('os.structs.TriState');
goog.require('os.ui.file.method.UrlMethod');
goog.require('plugin.file.zip.ZIPParser');
goog.require('plugin.file.zip.ZIPParserConfig');


describe('plugin.file.zip.ZIPParser', function() {
  var testUrl = '/base/test/resources/zip/test-csv.zip';
  var parser = new plugin.file.zip.ZIPParser();

  it('parses zip file content', function() {
    var urlMethod = new os.ui.file.method.UrlMethod();
    urlMethod.setUrl(testUrl);

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    urlMethod.listenOnce(os.events.EventType.COMPLETE, onComplete);
    urlMethod.loadFile();

    waitsFor(function() {
      return methodComplete == true;
    }, 'url to load');

    var parseComplete = false;
    var onParseComplete = function(event) {
      parseComplete = true;
    };

    goog.events.listenOnce(parser, os.events.EventType.COMPLETE, onParseComplete);

    runs(function( ){
      var file = urlMethod.getFile();
      expect(parser.processingZip_).toBe(false);
      expect(parser.getFiles().length).toBe(0);
        
      parser.setSource(file.getContent()); //will fire the COMPLETE for onParseComplete
  
      expect(parser.processingZip_).toBe(true);
      
      waitsFor(
        function() {
          // test document/folder parsing
          // make sure we can parse multiple files
          if (parseComplete) expect(parser.getFiles().length).toBe(4);
          return parseComplete;
        }, 
        'parser to finish', 
        15000
      );

  
    });

  });

  it('cleans up the parser', function() {
    parser.cleanup();

    expect(parser.initialized_).toBe(false);
    expect(parser.files_.length).toBe(0);
    expect(parser.source_.length).toBe(0);
  });
});
