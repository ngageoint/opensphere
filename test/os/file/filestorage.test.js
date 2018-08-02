goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.storage.AsyncStorageWrapper');


/**
 * Runs file storage tests with or without IndexedDB.
 * @param {boolean} idbEnabled If IndexedDB should be flagged as enabled
 */
os.storage.runFileStorageTests = function(idbEnabled) {
  var label = 'IndexedDB ' + (idbEnabled ? 'enabled' : 'disabled');
  describe(label, function() {
    var oldModernizrValue = Modernizr.indexeddb;

    var fs;

    var fileA = new os.file.File();
    fileA.setFileName('testFileA.xml');
    fileA.setUrl('local://testfileurlA');
    fileA.setContent('mah spoon is too big');
    fileA.setContentType('test+content+and+stuffA');
    fileA.setType('testA');

    var fileB = new os.file.File();
    fileB.setFileName('testFileB.xml');
    fileB.setUrl('local://testfileurlB');
    fileB.setContent('tuesdays coming, did you bring your coat?');
    fileB.setContentType('test+content+and+stuffB');
    fileB.setType('testB');

    it('should set the Modernizr flag', function() {
      Modernizr.indexeddb = idbEnabled;
    });

    it('should create a new file storage instance', function() {
      // this should be the only test with different behavior depending on the IDB flag. it needs to test that file
      // storage initialized with the correct storage mechanism. all other tests should not care about the flag.
      fs = new os.file.FileStorage();

      waitsFor(function() {
        if (idbEnabled) {
          return fs.storage.db_ != null;
        } else {
          return fs.storage instanceof os.storage.AsyncStorageWrapper;
        }
      }, 'file storage to initialize');

      runs(function() {
        if (idbEnabled) {
          expect(fs.storage.db_).not.toBeNull();
          expect(fs.storage.initDeferred).toBeNull();

          var objectStores = fs.storage.db_.getObjectStoreNames();
          expect(objectStores).not.toBeNull();
          expect(objectStores.length).toBe(1);
          expect(objectStores[0]).toBe(os.FILE_STORE_NAME);
        } else {
          expect(fs.storage.mechanism).not.toBeNull();
        }
      });
    });

    it('should synchronously identify if files are not in the database', function() {
      expect(fs.fileExists(fileA)).toBe(false);
      expect(fs.fileExists(fileB)).toBe(false);
      expect(fs.fileExists(fileA.getUrl())).toBe(false);
      expect(fs.fileExists(fileB.getUrl())).toBe(false);
    });

    it('should store files to the database', function() {
      var cbCount = 0;
      var ebCount = 0;
      var callback = function() {
        cbCount++;
      };
      var errback = function() {
        ebCount++;
      };

      fs.storeFile(fileA).addCallbacks(callback, errback);

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'file A to be stored');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);

        cbCount = 0;
        ebCount = 0;

        fs.storeFile(fileB).addCallbacks(callback, errback);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'file B to be stored');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
      });
    });

    it('should synchronously identify if files are in the database', function() {
      expect(fs.fileExists(fileA)).toBe(true);
      expect(fs.fileExists(fileB)).toBe(true);
      expect(fs.fileExists(fileA.getUrl())).toBe(true);
      expect(fs.fileExists(fileB.getUrl())).toBe(true);
      expect(fs.fileExists('local://notInTheDatabase')).toBe(false);
    });

    it('should update a file name if it exists in the database', function() {
      var imposter = new os.file.File();
      imposter.setFileName('testFileA.xml');
      imposter.setUrl('local://testfileurlA');
      imposter.setContent('mah spoon is too big');
      imposter.setContentType('test+content+and+stuffA');
      imposter.setType('testA');

      fs.setUniqueFileName(imposter);
      expect(imposter.getFileName()).toBe('testFileA-1.xml');

      var unique = new os.file.File();
      unique.setFileName('uniqueFile.xml');
      unique.setUrl('local://uniquefile');
      unique.setContent('i dont exist yet');
      unique.setContentType('text/plain');
      unique.setType('test');

      fs.setUniqueFileName(unique);
      expect(unique.getFileName()).toBe('uniqueFile.xml');
    });

    it('should load all files from the database', function() {
      var files = null;
      var ebCount = 0;
      var callback = function(result) {
        files = result;
      };
      var errback = function() {
        ebCount++;
      };

      fs.getFiles().addCallbacks(callback, errback);

      waitsFor(function() {
        return files != null || ebCount > 0;
      }, 'files to be retrieved');

      runs(function() {
        expect(ebCount).toBe(0);
        expect(files).not.toBeNull();
        expect(files.length).toBe(2);

        var a = files[0];
        expect(a instanceof os.file.File).toBeTruthy();
        expect(a.getFileName()).toBe(fileA.getFileName());
        expect(a.getUrl()).toBe(fileA.getUrl());
        expect(a.getContent()).toBe(fileA.getContent());
        expect(a.getContentType()).toBe(fileA.getContentType());
        expect(a.getType()).toBe(fileA.getType());

        var b = files[1];
        expect(b instanceof os.file.File).toBeTruthy();
        expect(b.getFileName()).toBe(fileB.getFileName());
        expect(b.getUrl()).toBe(fileB.getUrl());
        expect(b.getContent()).toBe(fileB.getContent());
        expect(b.getContentType()).toBe(fileB.getContentType());
        expect(b.getType()).toBe(fileB.getType());
      });
    });

    it('should load single files from the database', function() {
      var file = null;
      var ebCount = 0;
      var callback = function(result) {
        file = result;
      };
      var errback = function() {
        ebCount++;
      };

      fs.getFile(fileA.getUrl()).addCallbacks(callback, errback);

      waitsFor(function() {
        return file != null || ebCount > 0;
      }, 'file A to be retrieved');

      runs(function() {
        expect(ebCount).toBe(0);
        expect(file).not.toBeNull();

        expect(file instanceof os.file.File).toBeTruthy();
        expect(file.getFileName()).toBe(fileA.getFileName());
        expect(file.getUrl()).toBe(fileA.getUrl());
        expect(file.getContent()).toBe(fileA.getContent());
        expect(file.getContentType()).toBe(fileA.getContentType());
        expect(file.getType()).toBe(fileA.getType());

        file = null;
        ebCount = 0;
        fs.getFile(fileB.getUrl()).addCallbacks(callback, errback);
      });

      waitsFor(function() {
        return file != null || ebCount > 0;
      }, 'file B to be retrieved');

      runs(function() {
        expect(ebCount).toBe(0);
        expect(file).not.toBeNull();

        expect(file instanceof os.file.File).toBeTruthy();
        expect(file.getFileName()).toBe(fileB.getFileName());
        expect(file.getUrl()).toBe(fileB.getUrl());
        expect(file.getContent()).toBe(fileB.getContent());
        expect(file.getContentType()).toBe(fileB.getContentType());
        expect(file.getType()).toBe(fileB.getType());
      });
    });

    it('should delete files from the database', function() {
      var files = null;
      var cbCount = 0;
      var ebCount = 0;

      var getCallback = function(result) {
        files = result;
      };
      var callback = function() {
        cbCount++;
      };
      var errback = function() {
        ebCount++;
      };

      fs.deleteFile(fileA).addCallbacks(callback, errback);

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'file A to be deleted');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        expect(fs.fileExists(fileA)).toBe(false);
        expect(fs.fileExists(fileB)).toBe(true);

        fs.getFiles().addCallbacks(getCallback, errback);
      });

      waitsFor(function() {
        return files != null || ebCount > 0;
      }, 'files to be retrieved');

      runs(function() {
        expect(ebCount).toBe(0);
        expect(files).not.toBeNull();
        expect(files.length).toBe(1);

        var b = files[0];
        expect(b.getFileName()).toBe(fileB.getFileName());

        cbCount = 0;
        ebCount = 0;
        fs.deleteFile(fileB).addCallbacks(callback, errback);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'file B to be deleted');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        expect(fs.fileExists(fileA)).toBe(false);
        expect(fs.fileExists(fileB)).toBe(false);

        files = null;
        fs.getFiles().addCallbacks(getCallback, errback);
      });

      waitsFor(function() {
        return files != null || ebCount > 0;
      }, 'files to be retrieved');

      runs(function() {
        expect(ebCount).toBe(0);
        expect(files).not.toBeNull();
        expect(files.length).toBe(0);
      });
    });

    it('should clear files from the database', function() {
      var files = null;
      var cbCount = 0;
      var ebCount = 0;

      var getCallback = function(result) {
        files = result;
      };
      var callback = function() {
        cbCount++;
      };
      var errback = function() {
        ebCount++;
      };

      fs.storeFile(fileA).addCallbacks(callback, errback);
      fs.storeFile(fileB).addCallbacks(callback, errback);

      waitsFor(function() {
        return cbCount > 1 || ebCount > 0;
      }, 'files to be added');

      runs(function() {
        expect(cbCount).toBe(2);
        expect(ebCount).toBe(0);
        expect(fs.fileExists(fileA)).toBe(true);
        expect(fs.fileExists(fileB)).toBe(true);

        cbCount = 0;
        ebCount = 0;
        fs.clear().addCallbacks(callback, errback);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'files to be cleared');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        expect(fs.fileExists(fileA)).toBe(false);
        expect(fs.fileExists(fileB)).toBe(false);
        fs.getFiles().addCallbacks(getCallback, errback);
      });

      waitsFor(function() {
        return files != null || ebCount > 0;
      }, 'files to be retrieved');

      runs(function() {
        expect(ebCount).toBe(0);
        expect(files).not.toBeNull();
        expect(files.length).toBe(0);
      });
    });

    it('should dispose of file storage', function() {
      goog.dispose(fs);
    });

    it('should reset the Modernizr flag', function() {
      Modernizr.indexeddb = oldModernizrValue;
    });
  });
};

// run the tests with and without IndexedDB support
describe('os.file.FileStorage', function() {
  os.storage.runFileStorageTests(true);
  os.storage.runFileStorageTests(false);
});
