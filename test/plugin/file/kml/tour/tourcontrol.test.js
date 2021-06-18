goog.require('plugin.file.kml.tour.Tour');
goog.require('plugin.file.kml.tour.TourControl');

describe('plugin.file.kml.tour.TourControl', function() {
  const Tour = goog.module.get('plugin.file.kml.tour.Tour');
  const TourControl = goog.module.get('plugin.file.kml.tour.TourControl');
  it('pauses the tour once', function() {
    var tour = new Tour();
    var control = new TourControl(tour);
    tour.addToPlaylist(control);

    spyOn(tour, 'pause').andCallThrough();
    spyOn(tour, 'reset').andCallThrough();

    tour.play();
    expect(tour.playing).toBe(true);
    expect(tour.playlistIndex_).toBe(0);
    expect(control.paused_).toBe(false);

    waitsFor(function() {
      return !tour.playing;
    }, 'tour to pause');

    runs(function() {
      expect(tour.playing).toBe(false);
      expect(tour.playlistIndex_).toBe(0);
      expect(tour.reset).not.toHaveBeenCalled();
      expect(control.paused_).toBe(true);

      tour.play();
      expect(tour.playing).toBe(true);
    });

    waitsFor(function() {
      return !tour.playing;
    }, 'tour to pause');

    runs(function() {
      expect(tour.playing).toBe(false);
      expect(tour.reset).toHaveBeenCalled();
      expect(control.paused_).toBe(false);
    });
  });
});
