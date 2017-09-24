/**
 * @module sass
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import nodeSass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import log from 'b-ber-logger'
import { src, dist, env, build/*, theme*/ } from 'bber-utils'
import store from 'bber-lib/store'

// dirnames that may be referenced in the theme. we copy over assets when
// running the sass task
const ASSET_DIRNAMES = ['fonts', 'images']

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const createSCSSString = () =>
    new Promise((resolve) => { // eslint-disable-line consistent-return
        const chunks = []
        const { theme } = store
        const themeName = theme.name

        const themeSettingsPath  = path.join(src(), '_stylesheets', themeName, '_settings.scss')
        const themeOverridesPath = path.join(src(), '_stylesheets', themeName, '_overrides.scss')
        const themeStylesPath    = theme.entry

        try {
            // load user-defined variables
            if (fs.existsSync(themeSettingsPath)) {
                const variableOverrides = fs.readFileSync(themeSettingsPath)
                log.info()
                log.info(`Found SCSS variable overrides: ${path.basename(themeSettingsPath)}`)
                log.info('Prepending overrides to SCSS stream')
                chunks.push(variableOverrides)
            }
        } catch (err) {
            log.info('Building SCSS without user-defined overrides')
        }

        try {
            // load theme styles
            if (fs.existsSync(themeStylesPath)) {
                const themeStyles = fs.readFileSync(themeStylesPath)
                log.info(`Attempting build with [${themeName}] theme`)
                chunks.push(themeStyles)
            }
        } catch (err) {
            log.error(`
                Could not find theme [${themeName}].
                Make sure the theme exists and contains a valid [application.scss]`, __filename)
        }

        try {
            // load user-defined styles
            if (fs.existsSync(themeOverridesPath)) {
                const styleOverrides = fs.readFileSync(themeOverridesPath)
                log.info(`Found user-defined styles: ${path.basename(themeOverridesPath)}`)
                log.info('Appending user-defined styles to SCSS stream')
                chunks.push(styleOverrides)
            }
        } catch (err) {
            log.info('Building SCSS without user-defined styles')
        }


        if (chunks.length < 1) {
            const err = new Error('bber-modifiers/sass: No readable stylesheets were found.')
            log.error(err)
        }

        resolve(Buffer.concat(chunks))
    })

// make sure the compiled output dir exists
const ensureCSSDir = () =>
    new Promise(resolve =>
        fs.mkdirp(path.join(dist(), '/OPS/stylesheets'), (err) => {
            if (err) { throw err }
            resolve()
        })
    )

// copy assets that exist in theme directory to the corresponding directory in
// _project:
//
// my-theme/fonts/my-font.ttf    -> _project/_fonts/my-font.ttf
// my-theme/images/my-image.jpg  -> _project/_images/my-image.jpg
//
// if the asset already exists in the _project dir, it is *not* overwritten.
//
// these assets are then copied to the correct build dir by the `copy` task.
//
const copyThemeAssets = () =>
    new Promise((resolve) => {
        const { theme } = store
        const promises = []
        ASSET_DIRNAMES.forEach((dir) => {
            promises.push(new Promise((resolve) => {

                const themePath = path.resolve(path.dirname(theme.entry), dir)
                const srcPath = path.join(src(), `_${dir}`)

                try {
                    if (!fs.existsSync(srcPath)) {
                        fs.mkdirp(srcPath)
                    }
                } catch (err1) {
                    log.error(err1, 1)
                }

                try {
                    if (fs.lstatSync(themePath).isDirectory()) {
                        const files = fs.readdirSync(themePath)

                        files.forEach((file, i) => {
                            const input = path.join(themePath, file)
                            const output = path.join(srcPath, file)

                            fs.copy(input, output, {
                                overwrite: false,
                                errorOnExist: true,
                            }, (err2) => {
                                if (err2) { throw err2 }
                                if (i === files.length - 1) { // not sure about this...
                                    resolve()
                                }
                            })
                        })
                    }
                } catch (err0) {
                    if (err0.code === 'ENOENT') { return resolve() } // dir doesn't exist in the theme path, but doesn't need to, so proceed
                    log.error(`There was a problem copying [${themePath}] to [${srcPath}]`)
                    // log.error(err0)
                    resolve()
                }
            }))
        })

        Promise.all(promises).then(resolve)
    })


const renderCSS = scssString =>
    new Promise(resolve =>
        nodeSass.render({
            data: `$build: "${build()}";${scssString}`,
            includePaths: [path.join(src(), '_stylesheets/'), path.dirname(store.theme.entry)],
            outputStyle: env() === 'production' ? 'compressed' : 'nested',
            errLogToConsole: true,
        }, (err, result) => {
            if (err) { log.error(err.message, 1) }
            resolve(result)
        })
    )

const applyPostProcessing = ({ css }) =>
    new Promise(resolve =>
        postcss(autoprefixer({
            browsers: ['last 2 versions', '> 2%'],
            flexbox: 'no-2009',
        }))
        .process(css)
        .then(resolve)
    )

const writeCSSFile = css =>
    new Promise(resolve =>
        fs.writeFile(path.join(dist(), '/OPS/stylesheets/application.css'), css, (err) => {
            if (err) { throw err }
            resolve()
        })
    )

const sass = () =>
    new Promise((resolve) => {
        ensureCSSDir()
        .then(copyThemeAssets)
        .then(createSCSSString)
        .then(renderCSS)
        .then(applyPostProcessing)
        .then(writeCSSFile)
        .catch(err => log.error(err))
        .then(resolve)
    })


export default sass
