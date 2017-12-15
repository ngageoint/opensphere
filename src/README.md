# Overview

Here's an exceedingly high level overview of the various stacks in OpenSphere.

## Commands - `os.command`

OpenSphere has a command stack which allows the user to undo and redo various actions. Simply implement `os.command.ICommand` or extend one of the many existing commands and then add them to the stack. See `os.command.SequenceCommand` or `os.command.ParallelCommand` for combining multiple commands into one.

If you have an action that is _not_ undoable, then don't forget to warn the user and clear the command stack!

## Alert/Toast messages - `os.alert`

Alert the user with Info, Warning, or Error popups.

## Audio

Goes ding whenever you like.

## Data - `os.data`

`os.data.IDataProvider` and `os.data.IDataDescriptor` are the two items that drive the data catalog available in OpenSphere. Providers are responsible for querying servers for their data (e.g. via WMS GetCapabilities) and then creating a descriptor for each resulting data item. Each descriptor generally represents a layer that can be added to the map, but that is not necessarily true as descriptors can do any arbitrary action when activated.

Providers are generally configured either by the admin through `config/settings.json` or by the user via Settings > Data Servers.

Providers and Descriptors are used to drive the "Add Data" window and the "Layer Search" (or Descriptor) search provider.

## Layer Configs - `os.layer.config`

Layer configs are classes that take a set of options as an object and create a layer. They all implement `os.layer.config.ILayerConfig` and typically extend either `os.layer.config.AbstractTileLayerConfig` or `os.layer.config.AbstractDataSourceConfig`. Take the following examples:

XYZ layer options:

    {
      # The type is used by the LayerConfigFactory to create the proper layer config class
      'type': 'XYZ', 

      # Layers should have a unique id. If one is not provided then a random one will be assigned
      'id': 'example.com#layer',

      'url': 'https://example.com/layer/{z}/{x}/{y}.png',
      'maxZoom': 20,
      'minZoom': 2,
      'zoomOffset': -1,
      'projection': 'EPSG:3857',
      'proxy': false,
      'crossOrigin': 'anonymous',
      'tileSize': 512,
      'title': 'Some XYZ Layer',
      'provider': 'Example.com',
      'description': 'Shows some stuff in a layer'
    }

### Tying it together

`os.data.LayerSyncDescriptor` is the base layer descriptor class that adds layers via config and listens to the layer for changes so that those changes (color, style, etc.) can be persisted between sessions.

## Exporting - `os.ex`

If you are adding a new file type and want to be able to export that type, look at adding a new implementation of `os.ex.IExportMethod` and registering that with the Export Manager.

You can also add new persistence method (e.g. the ability to save a file to DropBox or some other service) by implementing `os.ex.IPersistenceMethod` and registering that with the Export Manager.

## Importing 

OpenSphere 
