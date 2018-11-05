/* eslint-disable class-methods-use-this */

/**
 * Scans directory contents and reads YAML files to create the `spine` and
 * `guide` elements in the `content.opf`. Writes essential navigation
 * documents (`toc.ncx`, `toc.xhtml`) to the output directory
 * @module navigation
 * @see {@link module:navigation#Navigation}
 */

import path from 'path'
import fs from 'fs-extra'
import rrdir from 'recursive-readdir'
import find from 'lodash/find'
import difference from 'lodash/difference'
import uniq from 'lodash/uniq'
import remove from 'lodash/remove'
import isArray from 'lodash/isArray'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'
import Ncx from '@canopycanopycanopy/b-ber-templates/Ncx'
import Guide from '@canopycanopycanopy/b-ber-templates/Opf/Guide'
import Spine from '@canopycanopycanopy/b-ber-templates/Opf/Spine'
import {
    YamlAdaptor,
    Template,
    ManifestItemProperties,
} from '@canopycanopycanopy/b-ber-lib'
import {
    flattenSpineFromYAML,
    nestedContentToYAML,
    pathInfoFromFiles,
} from './helpers'

/**
 * @alias module:navigation#Navigation
 */
class Navigation {
    /**
     * [constructor description]
     * @constructor
     * @return {Object}
     */
    constructor() {
        this.navDocs = ['toc.ncx', 'text/toc.xhtml']
    }

    /**
     * Remove the `toc.xhtml` and `toc.ncx` from the output directory
     * @return {Promise<Object|Error>}
     */
    createEmptyNavDocuments() {
        return new Promise(resolve => {
            log.info(
                `opf build navigation documents [${this.navDocs.join(', ')}]`
            )
            const promises = this.navDocs.map(a =>
                fs.writeFile(path.join(state.dist, 'OPS', a), '')
            )
            return Promise.all(promises).then(resolve)
        })
    }

    /**
     * Retrieve a list of all XHTML files in the output directory
     * @return {Promise<Object|Error>}
     */
    getAllXhtmlFiles() {
        return new Promise(resolve =>
            rrdir(`${state.dist}${path.sep}OPS`, (err, filearr) => {
                if (err) throw err
                // TODO: better testing here, make sure we're not including symlinks, for example
                const fileObjects = pathInfoFromFiles(filearr, state.dist)
                // only get html files
                const xhtmlFileObjects = fileObjects.filter(a =>
                    ManifestItemProperties.isHTML(a)
                )
                // prepare for diffing
                const filesFromSystem = uniq(
                    xhtmlFileObjects.map(a =>
                        path.basename(a.name, _.extension)
                    )
                )
                resolve({ filesFromSystem, fileObjects })
            })
        )
    }

    deepRemove(collection, fileName) {
        const found = remove(collection, { fileName })
        if (found.length) {
            return collection
        }

        collection.forEach(item => {
            // check against prop names
            if (item.nodes && item.nodes.length) {
                return this.deepRemove(item.nodes, fileName)
            }
            return item
        })

        return collection
    }

    /**
     * Resolve discrepancies between files that exist in the output directory and
     * those that are listed in the YAML manifest
     * @param  {Array} filesFromSystem XHTML files in the output directory
     * @param  {Array} filesFromYaml   Entries in the YAML manifest
     * @return {Promise<Object<Array>|Error>}
     */
    compareXhtmlWithYaml({ filesFromSystem, fileObjects }) {
        return new Promise(resolve => {
            // eslint-disable-line consistent-return
            const { spine } = state // current build process's spine
            const { spineList } = state.buildTypes[state.build] // spine items pulled in from type.yml file
            const flow = uniq(
                spine
                    .map(a => (a.generated ? null : a.fileName))
                    .filter(Boolean)
            ) // one-dimensional flow of the book used for the spine, omitting figures pages

            const pages = flattenSpineFromYAML(spineList)
            const missingFiles = difference(flow, filesFromSystem) // extra files on system
            const missingEntries = difference(filesFromSystem, pages) // extra entries in YAML

            if (missingFiles.length || missingEntries.length) {
                // there are discrepencies between the files on the system and files
                // declared in the `state.build`.yml file
                if (missingFiles.length) {
                    // there are extra entries in the YAML (i.e., missing XHTML pages)
                    missingEntries.forEach(a => {
                        log.warn(
                            `Removing redundant entry [${a}] in ${
                                state.build
                            }.yml`
                        )
                    })

                    missingFiles.forEach(item => {
                        remove(spine, { fileName: item })
                        state.update('spine', spine)

                        const _flowIndex = flow.indexOf(item)
                        flow.splice(_flowIndex, 1)

                        const _toc = this.deepRemove(state.toc, item)
                        state.update('toc', _toc)
                    })

                    const yamlpath = path.join(state.src, `${state.build}.yml`)
                    const nestedYamlToc = nestedContentToYAML(state.toc)
                    const content =
                        isArray(nestedYamlToc) && nestedYamlToc.length === 0
                            ? ''
                            : YamlAdaptor.dump(nestedYamlToc)

                    fs.writeFile(yamlpath, content, err => {
                        if (err) throw err
                        log.info(`opf emit ${state.build}.yml`)
                    })
                }

                if (missingEntries.length) {
                    // there are missing entries in the YAML (i.e., extra XHTML pages),
                    // but we don't know where to interleave them, so we just append
                    // them to the top-level list of files

                    missingEntries.forEach(name => {
                        if (state.contains('loi', { name }) < 0) {
                            // don't warn for figures pages
                            log.warn(
                                `Adding missing entry [${name}] to [${
                                    state.build
                                }.yml]`
                            )
                        }
                    })

                    // add the missing entry to the spine
                    // TODO: add to toc? add to flow/pages?
                    // TODO: there need to be some handlers for parsing user-facing attrs
                    const missingEntriesWithAttributes = missingEntries
                        .map(fileName => {
                            if (
                                state.contains('loi', { name: fileName }) > -1
                            ) {
                                return null
                            }

                            // TODO: state should handle dot-notation for add/remove
                            state.buildTypes[state.build].spineList.push(
                                fileName
                            )

                            return fileName
                        })
                        .filter(Boolean)

                    const yamlpath = path.join(state.src, `${state.build}.yml`)
                    const content =
                        isArray(missingEntriesWithAttributes) &&
                        missingEntriesWithAttributes.length === 0
                            ? ''
                            : YamlAdaptor.dump(missingEntriesWithAttributes)

                    fs.appendFile(yamlpath, content, err => {
                        if (err) throw err
                    })
                }
            }

            const filesFromYaml = { entries: pages, flow }
            resolve({
                pages,
                flow,
                fileObjects,
                filesFromSystem,
                filesFromYaml,
            })
        })
    }

    createTocStringsFromTemplate({ pages, ...args }) {
        log.info('opf build [toc.xhtml]')
        return new Promise(resolve => {
            const strings = {}
            const { toc } = state
            const tocHTML = Toc.items(toc)

            strings.toc = Template.render('document', tocHTML, Toc.document())

            resolve({ pages, strings, ...args })
        })
    }

    createNcxStringsFromTemplate({ pages, ...args }) {
        log.info('opf build [toc.ncx]')
        return new Promise(resolve => {
            const strings = {}
            const { toc } = state
            const ncxXML = Ncx.navPoints(toc)

            strings.ncx = Template.render('document', ncxXML, Ncx.document())

            resolve({ pages, strings, ...args })
        })
    }

    createGuideStringsFromTemplate({ flow, fileObjects, ...args }) {
        log.info('opf build [guide]')
        return new Promise(resolve => {
            const strings = {}
            const { spine } = state
            const guideXML = Guide.items(spine)

            strings.guide = Template.render('guide', guideXML, Guide.body())

            resolve({ strings, flow, fileObjects, ...args })
        })
    }

    createSpineStringsFromTemplate({ flow, fileObjects, ...args }) {
        log.info('opf build [spine]')
        return new Promise(resolve => {
            const strings = {}
            const { spine } = state

            // TODO: find somewhere better for this. we add entries to the spine
            // programatically, but then they're also found on the system, so we
            // dedupe them here
            const generatedFiles = remove(spine, a => a.generated === true)
            generatedFiles.forEach(a => {
                if (!find(spine, { fileName: a.fileName })) {
                    spine.push(a)
                }
            })

            // console.log(spine)
            // process.exit()

            const spineXML = Spine.items(spine)

            strings.spine = Template.render('spine', spineXML, Spine.body())

            resolve({ strings, flow, fileObjects, ...args })
        })
    }

    /**
     * Returns a new object from an array of return values from `Promise.all`.
     * Deep merges a single property passed in as `property`. Uses `Object.assign`
     * @param  {Array<Object>} args  The objects to merge
     * @param  {String} property     The properties of `args` to merge
     * @return {Object}              Deep merged object
     */
    deepMergePromiseArrayValues(args, property) {
        const props = Object.assign({}, ...args.map(a => a[property]))
        return Object.assign({}, [...args], { [property]: props }) // TODO: this is weird ...
    }

    writeTocXhtmlFile(args) {
        return new Promise(resolve => {
            const result = this.deepMergePromiseArrayValues(args, 'strings')
            const { toc } = result.strings
            const filepath = path.join(state.dist, 'OPS', 'text', 'toc.xhtml')
            fs.writeFile(filepath, toc, err => {
                if (err) throw err
                log.info(`opf emit toc.xhtml [${filepath}]`)
                resolve(result)
            })
        })
    }

    writeTocNcxFile(args) {
        return new Promise(resolve => {
            const result = this.deepMergePromiseArrayValues(args, 'strings')
            const { ncx } = result.strings
            const filepath = path.join(state.dist, 'OPS', 'toc.ncx')
            fs.writeFile(filepath, ncx, err => {
                if (err) throw err
                log.info(`opf emit toc.ncx [${filepath}]`)
                resolve(result)
            })
        })
    }

    normalizeResponseObject(args) {
        return new Promise(resolve => {
            const normalizedResponse = this.deepMergePromiseArrayValues(
                args,
                'strings'
            )
            resolve(normalizedResponse)
        })
    }

    /**
     * Initialize promise chain to build ebook navigation structure
     * @return {Promise<Object|Error>}
     */
    init() {
        return new Promise(resolve =>
            this.createEmptyNavDocuments()
                .then(resp => this.getAllXhtmlFiles(resp))
                .then(resp => this.compareXhtmlWithYaml(resp))
                .then(resp =>
                    Promise.all([
                        this.createTocStringsFromTemplate(resp),
                        this.createNcxStringsFromTemplate(resp),
                        this.createGuideStringsFromTemplate(resp),
                        this.createSpineStringsFromTemplate(resp),
                    ])
                )

                .then(resp =>
                    Promise.all([
                        // the two following methods both merge the results from `Promise.all`
                        // and return identical new objects containing all navigation
                        // information to the next method in the chain
                        this.writeTocXhtmlFile(resp),
                        this.writeTocNcxFile(resp),
                    ])
                )
                // merge the values from the arrays returned above and pass the response
                // along to write the `content.opf`
                .then(resp => this.normalizeResponseObject(resp))
                .catch(log.error)
                .then(resolve)
        )
    }
}

export default Navigation
