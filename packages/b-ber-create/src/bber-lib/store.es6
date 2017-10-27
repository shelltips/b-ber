/* eslint-disable global-require, import/no-dynamic-require */
import Yaml from 'bber-lib/yaml'
import path from 'path'
import fs from 'fs-extra'
import { isPlainObject, isArray, find, findIndex } from 'lodash'
import mime from 'mime-types'
import themes from 'b-ber-themes'
import log from 'b-ber-logger'
import yargs from 'yargs'
import crypto from 'crypto'
import {
    createPageModelsFromYAML,
    flattenNestedEntries,
} from 'bber-lib/helpers'

const cwd = process.cwd()

const BBER_MODULE_PATH = path.dirname(path.dirname(__dirname))
const BBER_PACKAGE_JSON = require(path.join(BBER_MODULE_PATH, 'package.json')) // eslint-disable-line import/no-dynamic-require


function dynamicPageTmpl() { throw new Error('[store.templates#dynamicPageTmpl] has not been initialized in b-ber-modifiers/inject') }
function dynamicPageHead() { throw new Error('[store.templates#dynamicPageHead] has not been initialized in b-ber-modifiers/inject') }
function dynamicPageTail() { throw new Error('[store.templates#dynamicPageTail] has not been initialized in b-ber-modifiers/inject') }


/**
 * @class Store
 */
class Store {
    set env(value)          { this._env = value           }
    set guide(value)        { this._guide = value         }
    set figures(value)      { this._figures = value       }
    set video(value)        { this._video = value         }
    set audio(value)        { this._audio = value         }
    set footnotes(value)    { this._footnotes = value     }
    set build(value)        { this._build = value         }
    set builds(value)       { this._builds = value        }
    set cursor(value)       { this._cursor = value        } // used for tracking nested sections open/close ids
    set config(value)       { this._config = value        }
    set metadata(value)     { this._metadata = value      }
    set version(value)      { this._version = value       }
    set spine(value)        { this._spine = value         }
    set toc(value)          { this._toc = value           }
    set remoteAssets(value) { this._remoteAssets = value  }
    set loi(value)          { this._loi = value           }
    set theme(value)        { this._theme = value         }
    set sequence(value)     { this._sequence = value      }
    set hash(value)         { this._hash = value          } // build hash used for bundled scripts, stylessheets, etc

    get env()               { return this._env            }
    get guide()             { return this._guide          }
    get figures()           { return this._figures        }
    get video()             { return this._video          }
    get audio()             { return this._audio          }
    get footnotes()         { return this._footnotes      }
    get build()             { return this._build          }
    get builds()            { return this._builds         }
    get cursor()            { return this._cursor         }
    get config()            { return this._config         }
    get metadata()          { return this._metadata       }
    get spine()             { return this._spine          }
    get version()           { return this._version        }
    get toc()               { return this._toc            }
    get remoteAssets()      { return this._remoteAssets   }
    get loi()               { return this._loi            }
    get theme()             { return this._theme          }
    get sequence()          { return this._sequence       }
    get hash()              { return this._hash           }

    /**
     * @constructor
     * @return {Object} Instance of Store
     */
    constructor() {
        this.loadInitialState()
    }

    /**
     * Validate input before getting/setting Store properties
     * @param  {String} prop Property to validate
     * @param  {*}      val  Value to validate (not `undefined`)
     * @return {Object}
     */
    _checkTypes(prop, val) {
        const _prop = `_${prop}`
        const _val = val
        if (!{}.hasOwnProperty.call(this, _prop)) {
            throw new TypeError(`Attempting to add non-existent property [${prop}] to class [Store]`) // eslint-disable-line max-len
        }

        if (typeof _val === 'undefined') {
            throw new TypeError(`Property [${prop}] cannot be set to [undefined]`)
        }

        return { _prop, _val }
    }

    _fileOrDefaults(type) {
        const { src, dist } = this.config
        const yamlPath = path.join(cwd, src, `${type}.yml`)

        let spineList = []
        let spineEntries = []
        let tocEntries = []

        try {
            if (fs.existsSync(yamlPath)) {
                spineList = Yaml.load(yamlPath) || []
                tocEntries = createPageModelsFromYAML(spineList, src) // nested navigation
                spineEntries = flattenNestedEntries(tocEntries) // one-dimensional page flow
            } else {
                throw new Error(`[${type}.yml] not found. Creating default file.`)
            }
        } catch (err) {
            if (/Creating default file/.test(err.message)) {
                // log.info(err.message)
                // createPagesMetaYaml(src, type)
            } else {
                throw err
            }
        }

        return {
            src,
            dist: `${dist}-${type}`,
            spineList,
            spineEntries,
            tocEntries,
        }
    }

    /**
     * Add an entry to an Object or Array property of Store
     * @param  {String} prop Property name
     * @param {*}       val Value to add
     * @return {*}
     */
    add(prop, val) {
        const { _prop, _val } = this._checkTypes(prop, val)

        if (isArray(this[_prop])) {
            this[_prop] = [...this[_prop], _val]
            return this[_prop]
        }

        if (isPlainObject(this[_prop])) {
            this[_prop] = { ...this[_prop], _val }
            return this[_prop]
        }

        if (typeof this[_prop] === 'string') {
            this[_prop] = this[_prop] + String(val)
            return this[_prop]
        }

        throw new Error('Something went wrong in `Store#add`')
    }

    /**
     * Remove an entry from an Object or Array
     * @param  {String} prop Property name
     * @param  {*}      val Value to remove
     * @return {*}
     */
    remove(prop, val) {
        const { _prop, _val } = this._checkTypes(prop, val)
        if (isArray(this[_prop])) {
            let index
            try {
                index = findIndex(this[_prop], _val)
                if (index < 0) {
                    throw new TypeError(`The _property [${val}] could not be found in [${this[prop]}]`)
                }
            } catch (err) {
                return err
            }

            this[_prop].splice(index, 1)
            return this[_prop]
        }

        if (isPlainObject(this[_prop])) {
            delete this[_prop][_val]
            return this[_prop]
        }

        throw new Error('Something went wrong in `Store#remove`')
    }

    /**
     * Merge an Object into a property of Store
     * @param  {String} prop Store key
     * @param  {Object} val  Object to merge into `key`
     * @return {Object}      Merged object
     */
    merge(prop, val) {
        const { _prop, _val } = this._checkTypes(prop, val)
        this[_prop] = { ...this[_prop], ..._val }
        return this[_prop]
    }

    /**
     * Update a property of Store
     * @param  {String} prop Property name
     * @param  {*} val  New value
     * @return {*}      Updated property
     */
    update(prop, val) {
        this[`_${prop}`] = val
        return this[`_${prop}`]
    }

    /**
     * [contains description]
     * @param  {String} collection  [description]
     * @param  {String} value       [description]
     * @return {Integer}
     */
    contains(collection, value) {
        if (!isArray(this[collection])) {
            throw new TypeError('[Store#contains] must be called on an array')
        }
        return findIndex(this[collection], value)
    }

    /**
     * Restore initial state of store
     * @return {Object} Store
     */

    loadInitialState() {
        this.guide        = []
        this.figures      = []
        this.video        = []
        this.audio        = []
        this.footnotes    = []
        this.build        = 'epub'
        this.builds       = {}
        this.cursor       = []
        this.metadata     = []
        this.spine        = []
        this.toc          = []
        this.remoteAssets = []
        this.loi          = []
        this.theme        = {}
        this.sequence     = []
        this.hash         = crypto.randomBytes(20).toString('hex')
        this.env          = process.env.NODE_ENV || 'development'
        this.config       = {
            src: '_project',
            dist: 'project',
            theme: 'b-ber-theme-serif',
        }

        // for dynamically created templates. functions here are overwritten
        // during build. see b-ber-modifiers/inject#mapSourcesToDynamicPageTemplate
        this.templates    = {
            dynamicPageTmpl,
            dynamicPageHead,
            dynamicPageTail,
        }

        this.loadSettings()
        this.loadMetadata()
        this.loadTheme()
        this.loadAudioVideo()
        this.loadBuilds()
    }

    reload() {
        this.guide        = []
        this.figures      = []
        this.footnotes    = []
        this.cursor       = []
        this.spine        = []
        this.toc          = []
        this.remoteAssets = []
        this.loi          = []
        this.sequence     = []
        this.templates    = { dynamicPageTmpl, dynamicPageHead, dynamicPageTail }
        this.hash         = crypto.randomBytes(20).toString('hex')
    }

    reset() {
        this.loadInitialState()
    }

    loadSettings() {
        const { version } = BBER_PACKAGE_JSON
        this.version = version

        if (fs.existsSync(path.join(cwd, 'config.yml'))) {
            this.config = { ...this.config, ...Yaml.load(path.join(cwd, 'config.yml')) }
        }
    }

    // depends on `config.src`
    loadMetadata() {
        const fpath = path.join(cwd, this.config.src, 'metadata.yml')
        if (fs.existsSync(fpath)) {
            this.metadata = [...this.metadata, ...Yaml.load(fpath)]
        }
    }

    loadTheme() {
        // just in case ...
        const themeError = new Error(`b-ber-lib/store: There was an error loading theme [${this.config.theme}]`)

        if ({}.hasOwnProperty.call(themes, this.config.theme)) {
            this.theme = themes[this.config.theme]
        } else {
            if (!{}.hasOwnProperty.call(this.config, 'themes_directory')) {
                if (!yargs.argv._[0] || yargs.argv._[0] !== 'theme') {
                    // user is trying to run a command without defining a theme, so bail
                    log.error('There was an error loading the theme, make sure you\'ve added a [themes_directory] to the [config.yml] if you\'re using a custom theme.')
                } else {
                    // user is trying to run a `theme` command, either to set
                    // or list the available themes.  we don't need the
                    // `theme` config object for this operation, so continue
                    // execution
                    this.theme = {}
                    return
                }

            }

            // possibly a user defined theme, test if it exists
            try {
                const userThemesPath = path.resolve(cwd, this.config.themes_directory)
                const userThemes = fs.readdirSync(userThemesPath).reduce((acc, curr) => {
                    if (!fs.lstatSync(path.resolve(userThemesPath, curr)).isDirectory()) { return acc }
                    const userModule =
                        fs.existsSync(path.resolve(userThemesPath, curr, 'package.json'))
                            ? require(path.resolve(userThemesPath, curr))
                            : require(path.resolve(userThemesPath, curr, 'index.js'))
                    return acc.concat(userModule)
                }, [])


                const userTheme = find(userThemes, { name: this.config.theme })

                if (!userTheme) {
                    log.error(`Could not find theme [${this.config.theme}]`)
                }

                // exists! set it

                this.theme = userTheme
                return

            } catch (err) {
                log.error(themeError)
            }

        }

    }

    loadAudioVideo() {
        const mediaPath = path.join(cwd, this.config.src, '_media')
        try {
            if (fs.existsSync(mediaPath)) {
                const media = fs.readdirSync(mediaPath)
                const video = media.filter(_ => /^video/.test(mime.lookup(_)))
                const audio = media.filter(_ => /^audio/.test(mime.lookup(_)))

                this.video = video
                this.audio = audio
            }
        } catch (err) {
            throw new Error(err)
        }
    }

    loadBuilds() {
        this.builds = {
            sample    : this._fileOrDefaults('sample'),
            epub      : this._fileOrDefaults('epub'),
            mobi      : this._fileOrDefaults('mobi'),
            pdf       : this._fileOrDefaults('pdf'),
            web       : this._fileOrDefaults('web'),
        }
    }
}

const store = new Store()
export default store
