/**
 * @module render
 */

import Promise from 'zousan'
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import MarkdownRenderer from 'bber-plugins/md'
import { pageHead, pageBody, pageTail } from 'bber-templates/pages'
import { src, dist, env } from 'bber-utils'
import { log } from 'bber-plugins'
import store from 'bber-lib/store'
import { findIndex } from 'lodash'
import { minify } from 'html-minifier'

const promises = []
const minificationOptions = {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    html5: true,
    keepClosingSlash: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
}


const writeMarkupToFile = (fname, markup) =>
    new Promise((resolve) => {

        const outputPath = path.join(dist(), 'OPS/text', `${fname}.xhtml`)

        return fs.writeFile(outputPath, markup, (err) => {
            if (err) { throw err }

            log.info(`bber-output/render: Wrote XHTML: [${path.basename(fname)}.xhtml]`)
            resolve()

        })
    })



// convert md to xhtml and wrap with page template
const createPageLayout = (fname, data) =>
    new Promise((resolve) => {

        const textDir = path.join(`${dist()}/OPS/text/`)
        const head    = pageHead(fname)
        const body    = MarkdownRenderer.render(fname, data)
        const tail    = pageTail(fname)

        let markup
        markup = renderLayouts(new File({
            path: './.tmp',
            layout: 'pageBody',
            contents: new Buffer(`${head}${body}${tail}`),
        }), { pageBody }).contents.toString()

        if (env() === 'production') {
            markup = minify(markup, minificationOptions)
        }

        try {
            if (!fs.existsSync(textDir)) {
                fs.mkdirSync(textDir)
            }
        } catch (err) {
            // noop
        }

        return writeMarkupToFile(fname, markup).then(resolve)

    })


const createXTHMLFile = (fpath) =>
    new Promise(resolve =>
        fs.readFile(fpath, 'utf8', (err, data) => {
            if (err) { throw err }
            const fname = path.basename(fpath, '.md')
            return createPageLayout(fname, data).then(resolve)
        })
    )

function render() {
    const mdDir = path.join(`${src()}/_markdown/`)

    return new Promise(resolve =>

        fs.readdir(mdDir, (err, _files) => {
            if (err) { throw err }

            const reference = store.spine
            const files = _files.filter(_ => _.charAt(0) !== '.')

            // sort the files in the order that they appear in `type.yml`, so that
            // we process them (and the images they contain) in the correct order
            files.sort((a, b) => {
                const filenameA = path.basename(a, '.md')
                const filenameB = path.basename(b, '.md')
                const indexA    = findIndex(reference, { fileName: filenameA })
                const indexB    = findIndex(reference, { fileName: filenameB })

                return indexA < indexB ? -1 : indexA > indexB ? 1 : 0
            })


            const len = files.length - 1
            return files.forEach((file, idx) => {

                log.info(`bber-output/render: Rendering Markdown: [${path.basename(file)}]`)

                promises.push(createXTHMLFile(path.join(mdDir, file)))

                Promise.all(promises)
                .catch(err => log.error(err, 1))
                .then(resolve)

            })
        })
    )
}

export default render
