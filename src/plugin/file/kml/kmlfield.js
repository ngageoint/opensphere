goog.provide('plugin.file.kml.KMLField');

goog.require('os.Fields');
goog.require('os.annotation');
goog.require('os.style');
goog.require('os.ui.slick.column');


/**
 * @enum {string}
 */
plugin.file.kml.KMLField = {
  BALLOON_TEXT: '_balloonText',
  DESCRIPTION: 'description',
  MD_DESCRIPTION: '_mdDescription',
  NAME: 'name'
};


// extend column auto size rules to include KML columns
goog.object.extend(os.ui.slick.column.fix, {
  'name': {
    order: -60,
    width: 200
  },
  'description': {
    order: -55
  }
});


/**
 * Fields that should be displayed on the source.
 *
 * @type {!Array<string>}
 * @const
 */
plugin.file.kml.SOURCE_FIELDS = [
  plugin.file.kml.KMLField.NAME,
  plugin.file.kml.KMLField.DESCRIPTION,
  os.annotation.OPTIONS_FIELD,
  os.Fields.BEARING,
  os.Fields.LAT,
  os.Fields.LON,
  os.Fields.LAT_DDM,
  os.Fields.LON_DDM,
  os.Fields.LAT_DMS,
  os.Fields.LON_DMS,
  os.Fields.MGRS,
  os.Fields.SEMI_MAJOR,
  os.Fields.SEMI_MINOR,
  os.Fields.SEMI_MAJOR_UNITS,
  os.Fields.SEMI_MINOR_UNITS,
  os.Fields.TIME,
  os.Fields.ORIENTATION,
  os.style.StyleField.CENTER_SHAPE,
  os.style.StyleField.SHAPE,
  os.style.StyleField.LABELS,
  os.style.StyleField.LABEL_COLOR,
  os.style.StyleField.LABEL_SIZE,
  os.style.StyleField.FILL_COLOR,
  os.style.StyleField.SHOW_LABELS
];


/**
 * Fields that are known to contain specialized JSON data.
 * @type {!Array<string>}
 */
plugin.file.kml.JsonField = [
  os.annotation.OPTIONS_FIELD,
  os.data.RecordField.RING_OPTIONS
];
