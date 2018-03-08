goog.require('plugin.file.kml.tour.MockTourPrimitive');
goog.require('plugin.file.kml.tour.Tour');


describe('plugin.file.kml.tour.Tour', function() {
  // test globals
  var testName = 'Test Name';
  var testDescription = 'Test Description';

  // the test tour
  var tour;

  // primitives that will be added to the playlist
  var first = new plugin.file.kml.tour.MockTourPrimitive(true);
  var second = new plugin.file.kml.tour.MockTourPrimitive(false);
  var third = new plugin.file.kml.tour.MockTourPrimitive(true);

  // the test tour playlist
  var playlist = [first, second, third];

  beforeEach(function() {
    tour = new plugin.file.kml.tour.Tour(testName, testDescription, playlist);

    // reset the playlist items
    playlist.forEach(function(item) {
      item.executedCount = item.pausedCount = item.resetCount = 0;
      item.resolver = undefined;
    });
  });

  it('initializes correctly', function() {
    expect(tour.name).toBe(testName);
    expect(tour.description).toBe(testDescription);
    expect(tour.playing).toBe(false);
    expect(tour.repeat).toBe(false);
    expect(tour.playlist_).toBe(playlist);
    expect(tour.playlist_[0]).toBe(first);
    expect(tour.playlist_[1]).toBe(second);
    expect(tour.playlist_[2]).toBe(third);
    expect(tour.playlistIndex_).toBe(0);
    expect(tour.currentPromise_).toBeUndefined();
  });

  it('adds to the playlist', function() {
    spyOn(tour, 'reset');

    var fourth = new plugin.file.kml.tour.MockTourPrimitive();
    tour.addToPlaylist(fourth);
    expect(tour.reset.callCount).toBe(1);

    var fifth = new plugin.file.kml.tour.MockTourPrimitive();
    tour.addToPlaylist(fifth);
    expect(tour.reset.callCount).toBe(2);

    var sixth = new plugin.file.kml.tour.MockTourPrimitive();
    tour.addToPlaylist(sixth);
    expect(tour.reset.callCount).toBe(3);

    expect(tour.playlist_.length).toBe(6);
    expect(tour.playlist_[3]).toBe(fourth);
    expect(tour.playlist_[4]).toBe(fifth);
    expect(tour.playlist_[5]).toBe(sixth);
    expect(tour.playlistIndex_).toBe(0);
  });

  it('gets the playlist', function() {
    expect(tour.getPlaylist()).toBe(playlist);
  });

  it('sets the playlist', function() {
    spyOn(tour, 'reset');

    var newPlaylist = [];
    tour.setPlaylist(newPlaylist);
    expect(tour.getPlaylist()).toBe(newPlaylist);
    expect(tour.reset).toHaveBeenCalled();
  });

  it('plays items in the playlist', function() {
    runs(function() {
      tour.play();
    });

    waitsFor(function() {
      return tour.currentPromise_ !== undefined;
    }, 'first tour item to execute');

    runs(function() {
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(0);
      expect(first.executedCount).toBe(1);
      expect(second.executedCount).toBe(0);

      expect(first.resolver).toBeDefined();
      first.resolver();
    });

    waitsFor(function() {
      return tour.playlistIndex_ === 2 && tour.currentPromise_ !== undefined;
    }, 'tour to continue playing');

    runs(function() {
      // should still be playing (waiting on the third item)
      expect(tour.playing).toBe(true);
      expect(tour.currentPromise_).toBeDefined();

      // execute should have been called on all three items (second does not wait)
      expect(first.executedCount).toBe(1);
      expect(second.executedCount).toBe(1);
      expect(third.executedCount).toBe(1);

      // tour didn't finish, so nothing should be paused or reset
      expect(first.pausedCount).toBe(0);
      expect(second.pausedCount).toBe(0);
      expect(third.pausedCount).toBe(0);

      expect(first.resetCount).toBe(0);
      expect(second.resetCount).toBe(0);
      expect(third.resetCount).toBe(0);

      expect(third.resolver).toBeDefined();
      third.resolver();
    });

    waitsFor(function() {
      return !tour.playing;
    }, 'tour to finish playing');

    runs(function() {
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeUndefined();

      playlist.forEach(function(item) {
        // all playlist items should have been executed and reset once, but not paused
        expect(item.executedCount).toBe(1);
        expect(item.resetCount).toBe(1);
        expect(item.pausedCount).toBe(0);
      });
    });
  });

  it('pauses and resumes execution', function() {
    spyOn(tour, 'onExecuteRejected_').andCallThrough();

    runs(function() {
      tour.play();
    });

    waitsFor(function() {
      return tour.currentPromise_ !== undefined;
    }, 'first tour item to execute');

    runs(function() {
      // tour should have executed the first item and be waiting on its promise to resolve
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeDefined();

      expect(first.executedCount).toBe(1);
      expect(second.executedCount).toBe(0);
      expect(third.executedCount).toBe(0);

      expect(first.pausedCount).toBe(0);
      expect(second.pausedCount).toBe(0);
      expect(third.pausedCount).toBe(0);

      // pause at the first item
      tour.pause();
    });

    waitsFor(function() {
      // wait for the first item's promise to be cancelled
      return tour.onExecuteRejected_.callCount > 0;
    }, 'stack to clear (to let the cancelled promise clear)');

    runs(function() {
      // tour should be paused at the first item
      expect(tour.playing).toBe(false);
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeUndefined();

      // pause is called on the entire playlist
      expect(first.pausedCount).toBe(1);
      expect(second.pausedCount).toBe(1);
      expect(third.pausedCount).toBe(1);

      // resume the tour
      tour.play();
    });

    waitsFor(function() {
      // wait for the first item to return a new promise
      return tour.currentPromise_ !== undefined;
    }, 'first tour item to continue execution');

    runs(function() {
      // tour should again be waiting on the first item's promise to resolve
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeDefined();

      // first item has now executed twice, others haven't executed yet
      expect(first.executedCount).toBe(2);
      expect(second.executedCount).toBe(0);
      expect(third.executedCount).toBe(0);

      // resolve the first item, second item should resolve immediately
      expect(first.resolver).toBeDefined();
      first.resolver();
    });

    waitsFor(function() {
      // wait until execution is waiting on the third item
      return tour.playlistIndex_ === 2 && tour.currentPromise_ !== undefined;
    }, 'tour to continue playing');

    runs(function() {
      // tour should now be waiting on the third item's promise to resolve
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(2);
      expect(tour.currentPromise_).toBeDefined();

      // first item has still executed twice, others once
      expect(first.executedCount).toBe(2);
      expect(second.executedCount).toBe(1);
      expect(third.executedCount).toBe(1);

      // pause count hasn't changed
      expect(first.pausedCount).toBe(1);
      expect(second.pausedCount).toBe(1);
      expect(third.pausedCount).toBe(1);

      // pause execution on the third item
      tour.pause();
    });

    waitsFor(function() {
      // wait for the third item's promise to be cancelled
      return tour.onExecuteRejected_.callCount > 1;
    }, 'stack to clear (to let the cancelled promise clear)');

    runs(function() {
      // tour is now paused on the third item
      expect(tour.playing).toBe(false);
      expect(tour.playlistIndex_).toBe(2);
      expect(tour.currentPromise_).toBeUndefined();

      expect(first.pausedCount).toBe(2);
      expect(second.pausedCount).toBe(2);
      expect(third.pausedCount).toBe(2);

      // resume the tour
      tour.play();
    });

    waitsFor(function() {
      // wait for the third item to return a new promise
      return tour.currentPromise_ !== undefined;
    }, 'third tour item to continue execution');

    runs(function() {
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(2);
      expect(tour.currentPromise_).toBeDefined();

      expect(first.executedCount).toBe(2);
      expect(second.executedCount).toBe(1);
      expect(third.executedCount).toBe(2);

      // resolve the third item, which should finish and reset the tour
      expect(third.resolver).toBeDefined();
      third.resolver();
    });

    waitsFor(function() {
      return !tour.playing;
    }, 'tour to finish playing');

    runs(function() {
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeUndefined();

      playlist.forEach(function(item) {
        // all playlist items should have been paused twice and reset once (on tour completion)
        // async items should have executed twice, sync items once
        expect(item.executedCount).toBe(item.waitForResolve ? 2 : 1);
        expect(item.resetCount).toBe(1);
        expect(item.pausedCount).toBe(2);
      });
    });
  });

  it('resets execution', function() {
    runs(function() {
      tour.play();
    });

    waitsFor(function() {
      return tour.currentPromise_ !== undefined;
    }, 'first tour item to execute');

    runs(function() {
      // tour should have executed the first item and be waiting on its promise to resolve
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeDefined();

      expect(first.executedCount).toBe(1);
      expect(second.executedCount).toBe(0);
      expect(third.executedCount).toBe(0);

      // play through to the third item
      expect(first.resolver).toBeDefined();
      first.resolver();
    });

    waitsFor(function() {
      return tour.playlistIndex_ === 2 && tour.currentPromise_ != null;
    }, 'tour to continue playing');

    runs(function() {
      // tour should now be waiting on the third item's promise to resolve
      expect(tour.playing).toBe(true);
      expect(tour.playlistIndex_).toBe(2);
      expect(tour.currentPromise_).toBeDefined();

      expect(first.executedCount).toBe(1);
      expect(second.executedCount).toBe(1);
      expect(third.executedCount).toBe(1);

      expect(first.resetCount).toBe(0);
      expect(second.resetCount).toBe(0);
      expect(third.resetCount).toBe(0);

      // reset the tour
      tour.reset();

      expect(tour.playing).toBe(false);
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.currentPromise_).toBeUndefined();

      expect(first.resetCount).toBe(1);
      expect(second.resetCount).toBe(1);
      expect(third.resetCount).toBe(1);
    });
  });
});
