goog.require('os.im.action.ImportActionCallbackConfig');
goog.require('plugin.im.action.feature.Manager');

describe('plugin.im.action.feature.Manager', function() {
  const FeatureActionManager = goog.module.get('plugin.im.action.feature.Manager');

  it('should simplify event roll-ups from callback configs...', function() {
    const dst = /* @type {ImportActionCallbackConfig} */ ({
      color: [],
      labelUpdateShown: false,
      notifyStyleChange: false,
      setColor: false,
      setFeaturesStyle: false
    });
    const src1 = /* @type {ImportActionCallbackConfig} */ ({
      color: [],
      labelUpdateShown: true,
      notifyStyleChange: false,
      setColor: false,
      setFeaturesStyle: false
    });
    const src2 = /* @type {ImportActionCallbackConfig} */ ({
      color: [
        [[{id_: 1}, {id_: 2}, {id_: 3}], 'rgba(255,255,255,1.0)'],
        [[{id_: 2}, {id_: 3}], 'rgba(255,255,0,1.0)'],
        [[{id_: 3}], 'rgba(255,0,255,1.0)']
      ],
      labelUpdateShown: false,
      notifyStyleChange: true,
      setColor: true,
      setFeaturesStyle: false
    });
    const src3 = /* @type {ImportActionCallbackConfig} */ ({
      color: [
        [[{id_: 1}, {id_: 2}, {id_: 3}], 'rgba(0,255,255,1.0)']
      ],
      labelUpdateShown: false,
      notifyStyleChange: false,
      setColor: true,
      setFeaturesStyle: false
    });

    FeatureActionManager.mergeNotify_(dst, src1);
    FeatureActionManager.mergeNotify_(dst, src2);
    FeatureActionManager.mergeNotify_(dst, src3);

    expect(dst.labelUpdateShown).toBe(true);
    expect(dst.notifyStyleChange).toBe(true);
    expect(dst.setColor).toBe(true);
    expect(dst.setFeaturesStyle).toBe(false);
    expect(dst.color.length).toBe(4);

    // notifyStyleChange, setFeatureStyle, etc are tested by style.test.js
    // FeatureActionManager.notify_(dst);
  });


  it('should deconflict color item arrays from callback configs...', function() {
    const config = /* @type {ImportActionCallbackConfig} */ ({
      color: [
        [[{id_: 1}, {id_: 2}, {id_: 3}], 'rgba(255,255,255,1.0)'],
        [[{id_: 2}, {id_: 3}], 'rgba(255,255,0,1.0)'],
        [[{id_: 3}], 'rgba(255,0,255,1.0)']
      ],
      labelUpdateShown: false,
      notifyStyleChange: false,
      setColor: true,
      setFeaturesStyle: false
    });

    FeatureActionManager.MIN_ITEMS_MERGE_NOTIFY_COLOR = 5; // replace the normal threshold of 10000
    FeatureActionManager.mergeNotifyColor_(config);

    expect(config.color[0][0].length).toBe(1);
    expect(config.color[1][0].length).toBe(1);
    expect(config.color[2][0].length).toBe(1);
  });
});
