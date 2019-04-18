/**
 * @module render
 */

import path from 'path'
import fs from 'fs-extra'
import { findIndex } from 'lodash'
import MarkdownRenderer from '@canopycanopycanopy/b-ber-grammar'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import log from '@canopycanopycanopy/b-ber-logger'
import { Template } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'

const writeMarkupToFile = (fname, markup) => {
    fs.writeFile(path.join(state.dist, 'OPS', 'text', `${fname}.xhtml`), markup).then(() =>
        log.info(`render xhtml [${path.basename(fname)}.xhtml]`),
    )
}

// convert md to xhtml and wrap with page template
const createPageLayout = (fileName, data) => {
    const textDir = path.join(state.dist, 'OPS', 'text')
    const body = MarkdownRenderer.render(fileName, data)
    const markup = Template.render(body, Xhtml.body())

    return fs
        .mkdirp(textDir)
        .then(() => writeMarkupToFile(fileName, markup))
        .catch(log.error)
}

const createXTHMLFile = fpath =>
    fs
        .readFile(fpath, 'utf8')
        .then(data => createPageLayout(path.basename(fpath, '.md'), data))
        .catch(log.error)

function render() {
    const markdownDir = path.join(state.src, '_markdown')

    return fs.readdir(markdownDir).then(files => {
        const promises = files
            .filter(a => a.charAt(0) !== '.')
            .sort((a, b) => {
                const filenameA = path.basename(a, '.md')
                const filenameB = path.basename(b, '.md')
                const indexA = findIndex(state.spine, { fileName: filenameA })
                const indexB = findIndex(state.spine, { fileName: filenameB })

                return indexA < indexB ? -1 : indexA > indexB ? 1 : 0
            })
            .reduce(
                (acc, curr) =>
                    acc.then(() =>
                        createXTHMLFile(path.join(markdownDir, curr)).then(() =>
                            log.info(`render markdown [${path.basename(curr)}]`),
                        ),
                    ),
                Promise.resolve(),
            )

        return promises.catch(log.error)
    })
}

export default render
