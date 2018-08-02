goog.provide('os.ui.ol.interaction.FocusInteraction');
goog.require('ol.interaction.Interaction');



/**
 * Handle if the map is focused or not
 *
 * @constructor
 * @param {olx.interaction.InteractionOptions=} opt_options Options.
 * @extends {ol.interaction.Interaction}
 */
os.ui.ol.interaction.FocusInteraction = function(opt_options) {
  os.ui.ol.interaction.FocusInteraction.base(this, 'constructor', {
    handleEvent: os.ui.ol.interaction.FocusInteraction.handleEvent
  });

  this.setActive(true);
  this.focused_ = false;
};
goog.inherits(os.ui.ol.interaction.FocusInteraction, ol.interaction.Interaction);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent
 * @return {boolean} `false` to stop event propagation
 */
os.ui.ol.interaction.FocusInteraction.handleEvent = function(mapBrowserEvent) {
  if (mapBrowserEvent.pointerEvent &&
      mapBrowserEvent.pointerEvent.buttons) {
    os.ui.areaManager.getMap().setFocused(true);
  }

  // Always stop events unless the map has been focused
  return os.ui.areaManager.getMap().getFocused();
};
