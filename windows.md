# Running/Developing OpenSphere on Windows 10+

The following are instructions for getting OpenSphere building and running on a Windows 10 system using the new Windows Subsystem for Linux (WSL). Note All of the following instructions assume a Windows 10 build of 16215 or later. 

## Installing WSL

See the following instructions for setting up WSL on Windows 10. 

https://docs.microsoft.com/en-us/windows/wsl/install-win10

After installing the WSL feature and selecting a distribution, the following OpenSphere project prerequisites need to be installed using the WSL shell environment.

* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [NodeJS 8](https://nodejs.org/en/download/package-manager/)
* Oracle Java 8 SDK, OpenJDK should also work
* [Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-java-with-apt-get-on-ubuntu-16-04)
* [Open SUSE](https://en.opensuse.org/SDB:Installing_Java)
* [Yarn](https://yarnpkg.com/lang/en/docs/install/#linux-tab)

After all prerequisites have been installed and verified, the OpenSphere getting started instructions should work.

## Working with Windows

The WSL environment has convenient mounts for all of the windows drives, so it easy to share files/folders with WSL and Windows by utilizing the drive mounts in WSL `/mnt/<drive>/<path>`. For example, you could configured the following path in Windows for the OpenSphere related projects:

`c:\source\ngageoint`

## Opening a WSL shell

The windows WSL environment can be opened in a few ways, open a normal command prompt/PowerShell and just type wsl. Alternatively, find the distro or "wsl" from the start menu and run. This should open the WSL shell.

## Cloning OpenSphere

From within the (WSL) shell, cd to your working directory. Using the example, this would be cd `/mnt/c/source/ngageoint`

From this point forward, we can follow the Getting Started instructions provided by the OpenSphere project.

* Fork/Clone the https://github.com/ngageoint/opensphere project in your project working directory `/mnt/c/source/ngageoint`
* Fork/Clone the https://github.com/ngageoint/opensphere-yarn-workspace project to your working directory `/mnt/c/source/ngageoint`

### Windows/Git

Git commands can be done from either Windows dos/powershell or WSL environment, however, be aware of Operating System end of line differences. Linux and Windows use different end of line markers, it's strongly recommend that the following commands be run from within each OpenSphere project to ensure files do not get changed by git/windows. 

```
git config core.eol lf
git config core.autocrlf false
```

## Setting up the OpenSphere workspace

Now that the projects are cloned and ready, all `npm/node/yarn` related commands should be run from the WSL environment.

Following the example:
```
cd /mnt/c/source/ngageoint/opensphere
yarn install
npm run build
````

## Hosting

See the OpenSphere readme about locally hosting the OpenSphere application.

## Editing

If the project was checked out to one of the /mnt/? folders, then all of the files for the project are living on the Windows file system! Pick your favorite code editor/IDE and go to work.

Please be aware of the coding styles and linux/windows end of line differences. Most modern IDE's have options to specify preferences.

Otherwise, use the WSL terminal to run project related commands, and code editing in your Windows editor of choice.

## Using VSCode
[Visual Studio Code](https://code.visualstudio.com/) Is a free multi-platform open source code editor with a lot of handy features.This IDE is actually pretty good (maybe not prefect, but I like it). One feature that is very useful for projects like OpenSphere, is a way to define a preferred integrated terminal environment, like WSL terminal on Windows, see: https://blogs.msdn.microsoft.com/commandline/2017/10/27/running-node-js-on-wsl-from-visual-studio-code/

For those of you who have adopted VSCode and are working on this project, the following things should be done to make the experience a bit better.

### Plugins

Install the following plugins:
* ESLint
* Beautify

Other handy plugin(s:)
* Git Lens

### Workspace
Visual Studio Code support "[Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces)" configuration files. As OpenSphere is a likely candidate for a multi-root workspace project, this is a useful feature.

The following is a workspace file that defines a number of settings that are consistent with the OpenSphere baseline. The contents of the following can be copied to a file called ``` opensphere.code-workspace ```, located at the workspace level of the project.

```
{
	"folders": [
		{
			"path": "."
		}
	],
	"settings": {
		"editor.tabSize": 2,
		"files.autoSave": "afterDelay",
		"files.autoSaveDelay": 1000,
		"terminal.integrated.shell.windows": "wsl.exe",
		"eslint.enable": true,
		"eslint.autoFixOnSave": true,
		"files.exclude": {
			"**/.git": true,
			"**/.svn": true,
			"**/.hg": true,
			"**/CVS": true,
			"**/.DS_Store": true,
			"**/.build": true,
			"**/node_modules": true,
			"**/dist": true
		}
	}
}
```
