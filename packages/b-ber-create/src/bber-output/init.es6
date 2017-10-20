import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import log from 'b-ber-logger'
import store from 'bber-lib/store'
import getAssets from 'bber-assets'
import { setTheme } from 'bber-lib/theme'
import {
    sourceDirs,
    config,
    metadata,
    javascripts,
    stylesheets,
    markdown,
    typeYaml,
    readme,
    gitignore,
} from 'bber-templates'

/**
 * @class Initializer
 */
class Initializer {
    set src(val)            { this._src = val }
    set dist(val)           { this._dist = val }
    set cwd(val)            { this._cwd = val }
    set dirs(val)           { this._dirs = val }
    set files(val)          { this._files = val }
    set projectPath(val)    { this._projectPath = val }

    get src()               { return this._src }
    get dist()              { return this._dist }
    get cwd()               { return this._cwd }
    get dirs()              { return this._dirs }
    get files()             { return this._files }
    get projectPath()       { return this._projectPath }

    /**
     * @constructor
     * @param  {Object} argv Command Line arguments
     * @return {Object}
     */
    constructor({ cwd = '', argv = { src: '_project', dist: 'project' } }) {
        const { src, dist } = argv

        if (!cwd) { throw new Error('Base directory not provided') }
        if (!src || !dist) { throw new Error('Both [src] and [dist] arguments must be provided') }
        if (src === dist) { throw new Error('[src] and [dist] directories must have different names') }

        this.cwd = cwd
        this.src = src
        this.dist = dist

        this.projectPath = path.join(this.cwd, this.src)
        this.buildTypes = ['epub', 'mobi', 'pdf', 'sample', 'web']

        this.dirs = sourceDirs(this.projectPath)

        this.files = [
            ...this.buildTypes.map(_ => typeYaml(this.projectPath, _)),
            config(this.projectPath, store.config.dist),
            metadata(this.projectPath),
            ...javascripts(this.projectPath),
            ...stylesheets(this.projectPath),
            ...markdown(this.projectPath),
            readme(this.projectPath, cwd),
            gitignore(this.projectPath),
        ]

        store.builds = {
            ...store.builds,
            epub: { ...store.builds.epub, src, dist: `${dist}-epub` },
            mobi: { ...store.builds.mobi, src, dist: `${dist}-mobi` },
            pdf: { ...store.builds.pdf, src, dist: `${dist}-pdf` },
            web: { ...store.builds.web, src, dist: `${dist}-web` },
            sample: { ...store.builds.sample, src, dist: `${dist}-sample` },
        }
    }

    /**
     * [_makeDirs description]
     * @return {Promise<Object|Error>}
     */
    _makeDirs() {
        return new Promise((resolve0) => {
            const promises = this.dirs.map(_ =>
                new Promise(resolve1 =>
                    fs.mkdirp(_, (err) => {
                        if (err) { throw err }
                        resolve1()
                    })
                )
            )
            return Promise.all(promises).then(resolve0)
        })
    }

    /**
     * [_writeFiles description]
     * @return {Promise<Object|Error>}
     */
    _writeFiles() {
        return new Promise((resolve0) => {
            const promises = this.files.map(_ =>
                new Promise(resolve1 =>
                    fs.writeFile(_.relativePath, _.content, (err) => {
                        if (err) { throw err }
                        resolve1()
                    })
                )
            )
            return Promise.all(promises).then(resolve0)
        })
    }

    _copyImages() {
        return new Promise(resolve => {
            const promises = []
            getAssets().then(assets => {
                const { 'b-ber-logo': bberLogo, 'default-publishers-logo': publishersLogo } = assets
                const images = [bberLogo, publishersLogo]

                log.info('Copying development assets')
                images.forEach(a => {
                    promises.push(fs.copy(a, path.join(this.projectPath, '_images', path.basename(a))))
                })

                Promise.all(promises).then(resolve)
            })
        })

    }
    _setTheme() {
        log.info('Setting default theme')
        return new Promise(resolve => {
            setTheme(store.theme.name, [store.theme.name], path.dirname(this.projectPath)).then(resolve)
        })
    }

    /**
     * Write default directories and files to the source directory
     * @return {Promise<Object|Error>}
     */
    start() {
        return new Promise(resolve =>
            this._makeDirs()
            .then(() => this._writeFiles())
            .then(() => this._copyImages())
            .then(() => this._setTheme())
            .catch(err => log.error(err))
            .then(resolve)
        )
    }
}

export default Initializer
