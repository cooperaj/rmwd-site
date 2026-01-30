# RealMenWearDress.es

## Easy Docker build
```bash
docker build -t rmwd:dev .
```

## Development

### Install
 1. [Follow instructions for asdf](https://asdf-vm.com/guide/getting-started.html#_1-install-asdf)
 1. Install things
    ```bash
    # necessary build tooling
    asdf plugin add nodejs
    asdf plugin add golang
    asdf plugin add gohugo
    asdf plugin add dart-sass https://github.com/nakamiri/asdf-dart-sass.git

    # install the versions specificed in .tool-versions
    asdf install

    # install asset dependencies
    npm i
    ```

### Build
```bash
# Build the site
hugo build

# Watch for changes
hugo server --forceSyncStatic
```

### Hugo Workspaces
Using a worksspace allows you to make live edits to the themes files and have the server process pick them
up and rebuild your site.

 1. Ensure the theme is available alongside this project in the folder `rmwd-hugo-theme`
 1. Set the environment variable `HUGO_MODULE_WORKSPACE` to `hugo.work` before running the above build instructions.
    ```bash
    export HUGO_MODULE_WORKSPACE=hugo.work
    ```