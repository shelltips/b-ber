/* eslint-disable class-methods-use-this */

import fs from 'fs-extra'
import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import kebabCase from 'lodash/kebabCase'
import find from 'lodash/find'
import {trimSlashes} from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'


class Reader {
    constructor() {
        this.outputDirName = 'epub'
        this.outputDir = path.join(this.dist, this.outputDirName)
        this.epubAssets = ['META-INF', 'OPS', 'mimetype']

        this.readerModuleName = '@canopycanopycanopy/b-ber-reader'
        this.readerAppPath = null

        return new Promise(resolve => {
            this.createOutputDir()
                .then(_ => this.ensureReaderModuleExists())
                .then(_ => this.copyEpubToOutputDir())
                .then(_ => this.writeBookManifest())
                .then(_ => this.copyReaderAppToOutputDir())
                .catch(err => log.error(err))
                .then(resolve)
        })

    }
    get src() {
        return state.src
    }
    get dist() {
        return state.dist
    }
    get remoteURL() {
        return state.config.remote_url || 'http://localhost:3000'
    }
    ensureReaderModuleExists() {
        try {
            this.readerAppPath = path.dirname(path.join(require.resolve(this.readerModuleName)))
        } catch (err) {
            log.error(`Cannot find module ${this.readerModuleName}. Try running npm i -S ${this.readerModuleName}`)
            process.exit(1)
        }

        return Promise.resolve()
    }
    createOutputDir() {
        return fs.ensureDir(this.outputDir)
    }
    copyEpubToOutputDir() {
        const promises = []
        return new Promise(resolve => {
            this.epubAssets.forEach(item =>
                promises.push(
                    fs.move(path.join(this.dist, item), path.join(this.outputDir, item))
                )
            )

            Promise.all(promises).then(resolve)
        })
    }
    getBookMetadata(term) {
        const entry = find(state.metadata, {term})
        if (entry && entry.value) return entry.value
        log.warn(`Could not find metadata value for ${term}`)
        return ''
    }
    writeBookManifest() {
        const title = this.getBookMetadata('title')
        const url = `${trimSlashes(this.remoteURL)}/${this.outputDirName}/${trimSlashes(kebabCase(title))}`
        const cover = `${url}/OPS/images/${this.getBookMetadata('cover')}`
        const manifest = [{title, url, cover}]

        return fs.writeJson(path.join(this.outputDir, 'manifest.json'), manifest)
    }
    copyReaderAppToOutputDir() {
        return fs.copy(this.readerAppPath, this.dist)
    }

}

const main = _ => new Reader()

export default main