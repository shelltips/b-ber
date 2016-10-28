# b-ber-creator

A command-line epub maker.

## Installation

```bash
$ git clone https://github.com/triplecanopy/b-ber-creator.git
$ cd b-ber-creator && npm install
```

## Workflow

If working in a development environment, replace `bber` in the below commands with `npm start --`

```bash
$ bber init     # Initialize the directory structure for the book
$ bber create   # Create the epub
$ bber site     # Download Gomez and install dependencies
$ bber publish  # Move epub to _site directory
$ bber deploy   # Upload the site directory to a server
```

## Development

```
Usage: npm start -- <command> [options]

Commands:
  create   Create an Epub dir structure
  markit   Convert markdown to HTML
  serve    Start a development server
  sass     Compile the sass
  scripts  Compile the scripts
  render   Render layouts
  sass     Compile SCSS
  inject   Inject scripts and styles
  copy     Copy static assets to output dir
  opf      Generate the opf

Examples:
  npm start -- create [options]

For more information on a command, enter npm start -- <command> --help
```

## Commands via `bber`

Run CLI commnads with `bber` rather than `npm`. The `bber` command requires transpiled JSX in the `dist` directory during pre-production phases.

```bash
$ npm run build   # transpile JSX
$ npm link        # create simlink to bber/bin/cli
$ bber init       # `bber` is now available
```

## Testing

```
$ npm test
```
