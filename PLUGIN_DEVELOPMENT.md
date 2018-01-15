# Plugin Development

OpenSphere plugins can add new layer types, new file formats for importing and exporting, new provider or server types for listing available data from various services, new search implementations, new UI elements or windows, and much, much more!


## File Type Support

Importing and exporting new file types ([GeoJSON, KML, CSV, etc.](https://github.com/ngageoint/opensphere/tree/master/src/plugin/file)). Each file type plugin generally adds:

* Content type detection (an implementation of [`os.file.IContentTypeMethod`](https://github.com/ngageoint/opensphere/blob/master/src/os/file/icontenttypemethod.js), but there are abstract implementations of XML and JSON detection)
* An import UI, which is used to launch a form or wizard for configuring how the file is to be imported (an implementation of [`os.ui.im.IImportUI`](https://github.com/ngageoint/opensphere/blob/master/src/os/ui/im/iimportui.js) but generally extending [`os.ui.im.FileImportUI`](https://github.com/ngageoint/opensphere/blob/master/src/os/ui/im/fileimportui.js))
* A layer config (an implementation of [`os.layer.config.ILayerConfig`](https://github.com/ngageoint/opensphere/blob/master/src/os/layer/config/ilayerconfig.js), generally extending either [`AbstractTileLayerConfig`](https://github.com/ngageoint/opensphere/blob/master/src/os/layer/config/abstracttilelayerconfig.js) or [`AbstractDataSourceLayerConfig`](https://github.com/ngageoint/opensphere/blob/master/src/os/layer/config/abstractdatasourcelayerconfig.js))
* A parser to parse the file into features (implementation of [`os.parse.IParser<ol.Feature>`](https://github.com/ngageoint/opensphere/blob/master/src/os/parse/iparser.js))
* A provider (implementation of [`os.data.IDataProvider`](https://github.com/ngageoint/opensphere/blob/master/src/os/data/idataprovider.js) extending [`os.data.FileProvider`](https://github.com/ngageoint/opensphere/blob/master/src/os/data/fileprovider.js)) 
* An exporter (implementation of [`os.ex.IExportMethod`](https://github.com/ngageoint/opensphere/blob/master/src/os/ex/iexportmethod.js), generally extending [`os.ex.AbstractExporter`](https://github.com/ngageoint/opensphere/blob/master/src/os/ex/abstractexporter.js))

The file plugins also provide their own descriptor implementations, but any new plugins should first try using [`os.data.ConfigDescriptor`](https://github.com/ngageoint/opensphere/blob/master/src/os/data/configdescriptor.js) before rolling a new one.


## New Server/Provider Types

Data providers such as [ArcGIS](https://github.com/ngageoint/opensphere/tree/master/src/plugin/arc), [Geoserver](https://github.com/ngageoint/opensphere/tree/master/src/plugin/ogc), and others are implemented as plugins. If you want to extend OpenSphere to support an additional server type or protocol (like OGC Catalog Service for the Web - CSW), this is the type of plugin you need to implement. Each of them adds:

* The provider (implementation of [`os.data.IDataProvider`](https://github.com/ngageoint/opensphere/blob/master/src/os/data/idataprovider.js)), which is responsible for querying the server and creating descriptors for the available layers
* Content Type and/or URL detection for adding new servers of that type, which in turn activates...
* A form for letting the user add a new server of that type
* A layer type if the server has a custom format (e.g. Arc REST service JSON). If the service returns standard formats such as GeoJSON, this is not necessary.


## Search providers

Search providers (used via the search box in the top right) can search for places, layers, documents, or anything else. The [Google Places](https://github.com/ngageoint/opensphere/tree/master/src/plugin/google/places) and [Descriptor Search](https://github.com/ngageoint/opensphere/tree/master/src/plugin/descriptor) plugins are good examples of search providers.


## Plugin examples

See [opensphere-plugin-example](https://github.com/ngageoint/opensphere-plugin-example) for an example of setting up an external (or perhaps private) plugin. That is mostly boilerplate intended to get a project started and does not have much in the way of actual code.

Although OpenSphere supports external plugins, it has several "in-tree" plugins which provide functionality that we consider core to the application. These are all useful examples for plugin development, as well as their main purpose of providing useful functionality.

* [area](https://github.com/ngageoint/opensphere/tree/master/src/plugin/area) - adds the ability to import specific file types as areas instead of data layers
* [audio](https://github.com/ngageoint/opensphere/tree/master/src/plugin/audio) - adds the ability to import custom audio files for different alert noises
* [featureaction](https://github.com/ngageoint/opensphere/tree/master/src/plugin/featureaction) - adds the ability to run local filter functions on data import that takes the resulting items and applies an action (like changing the style)
* [capture](https://github.com/ngageoint/opensphere/tree/master/src/plugin/capture) - adds the ability to record screenshots and GIF recordings of the timeline
* [overview](https://github.com/ngageoint/opensphere/tree/master/src/plugin/overview) - adds the small overview map to the top right
* [params](https://github.com/ngageoint/opensphere/tree/master/src/plugin/params) - adds the ability to right-click layers and change the request parameters sent to the server
* [places](https://github.com/ngageoint/opensphere/tree/master/src/plugin/places) - integrates heavily with editable KML from the KML plugin to provide a "Saved Places" layer
* [suncalc](https://github.com/ngageoint/opensphere/tree/master/src/plugin/suncalc) - adds the ability to show Sun/Moon info in a dialog (right-click on the map), in addition to the day/night lightstrip shown in the timeline
* [vectortools](https://github.com/ngageoint/opensphere/tree/master/src/plugin/vectortools) - provides the copy/merge/join options for vector layers
* [weather](https://github.com/ngageoint/opensphere/tree/master/src/plugin/weather) - simple plugin just adds an entry to the coordinate menu that launches a weather forecast for that location
* [xyz](https://github.com/ngageoint/opensphere/tree/master/src/plugin/xyz) - provides support for XYZ (zoom, X/Y) tile layers

Note that some of the plugins have corresponding [views](https://github.com/ngageoint/opensphere/tree/master/views/plugin) and [tests](https://github.com/ngageoint/opensphere/tree/master/test/plugin).
