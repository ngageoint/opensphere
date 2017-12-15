# Plugin Development

OpenSphere plugins can add new layer types, new file formats for importing and exporting, new provider or server types for listing available data from various services, new search implementations, new UI elements or windows, and much, much more!

Although OpenSphere supports external plugins, it has several plagins which provide functionality that we consider core to the application. Those will serve as our examples.

## File Type Support

Importing and exporting new file types (GeoJSON, KML, CSV, etc.). Each file type plugin generally adds:

* Content type detection (an implementation of `os.file.IContentTypeMethod`, but there are abstract implementations of XML and JSON detection)
* An import UI, which is used to launch a form or wizard for configuring how the file is to be imported (an implementation of `os.ui.im.IImportUI` but generally extending `os.ui.im.FileImportUI`)
* A layer config (an implementation of `os.layer.config.ILayerConfig`, generally extending either `AbstractTileLayerConfig` or `AbstractDataSourceLayerConfig`)
* A parser to parse the file into features (implementation of `os.parse.IParser<ol.Feature>`
* A provider (implementation of `os.data.IDataProvider` extending `os.data.FileProvider`) 
* An exporter (implementation of `os.ex.IExportMethod`, generally extending `os.ex.AbstractExporter`)

The file plugins also provide their own descriptor implementations, but any new plugins should first try using `os.data.ConfigDescriptor` before rolling a new one.

## New Server/Provider Types

Data providers such as ArcGIS, Geoserver, and others are implemented as plugins. Each of them adds:

* The provider (implementation of `os.data.IDataProvider`), which is responsible for querying the server and creating descriptors for the available layers
* Content Type and/or URL detection for adding new servers of that type, which in turn activates...
* A form for letting the user add a new server of that type
* A layer type if the server has a custom format (e.g. Arc REST service JSON). If the service returns standard formats such as GeoJSON, this is not necessary.

## Search providers

Search providers (used via the search box in the top right) can search for places, layers, documents, or anything else. The Google places and descriptor plugins are good examples of search providers.
