goog.require('os.ui.Icons');


describe('os.ui.Icons', function() {
  it('should not create iconSets with quotes in them', function() {
    var id = 'QUOTE\'S BOY\'S';
    var svgIcons = ['<image xlink:href="features-base.png" width="16px" height="16px"><title>Feature layer</title></image>',
        '<image class="time-icon" xlink:href="time-base.png" width="16px" height="16px"><title>This layer supports animation over time</title></image>'
    ];
    var faIcons = [];
    var color = '#fa0';
    var result = os.ui.createIconSet(id, svgIcons, faIcons, color);

    // it should hash the ID, so the original value should be nowhere to be found in the result
    expect(result.indexOf(id)).toBe(-1);
  });
});
