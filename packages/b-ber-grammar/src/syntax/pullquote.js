// we can't use our nice factory for this because it doesn't support
// customized closing elements (always outputs `</section>`), so we have to
// write it long-hand. see comments below

import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import { BLOCK_DIRECTIVE_MARKER, BLOCK_DIRECTIVE_MARKER_MIN_LENGTH } from '@canopycanopycanopy/b-ber-shapes/directives'
import plugin from '../parsers/section'
import { attributesObject, attributesString } from './helpers'

const marker = BLOCK_DIRECTIVE_MARKER
const minMarkers = BLOCK_DIRECTIVE_MARKER_MIN_LENGTH
const markerOpen = /^(pullquote|blockquote|exit)(?::([^\s]+)(\s.*)?)?$/
const markerClose = /(exit)(?::([\s]+))?/

let _line = null
let citation = ''
const pullquoteIndices = [] // track these separately

export default {
    plugin,
    name: 'pullQuote',
    renderer: ({ instance, context }) => ({
        marker,
        minMarkers,
        markerOpen,
        markerClose,
        validateOpen(params, line) {
            _line = line
            const match = params.trim().match(markerOpen) || false
            if (match && match.length) {
                const [, , id] = match
                if (typeof id === 'undefined') {
                    log.error(
                        `Missing [id] attribute for [${exports.default.name}:start] directive ${
                            context.filename
                        }.md:${line}`,
                    )
                    return false
                }
            }
            return match
        },
        render(tokens, idx) {
            const filename = `_markdown/${context.filename}.md`
            const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

            let result = ''

            const token = tokens[idx].info.trim()

            // we handle opening and closing render methods on element open, since
            // we need to append data (citation blocks) from the directive's opening
            // attributes to the end of the element
            if (tokens[idx].nesting === 1) {
                // either a `pullquote`, `blockquote` or an `exit` directive, we
                // keep matches for both in `open` and `close` vars below
                const open = token.match(markerOpen)
                const close = token.match(markerClose)

                if (open && !close) {
                    // the pullquote opens
                    const [, type, id, attrs] = open

                    // we could just state the id in a variable outside of `render`, but
                    // good to keep consistent with the normal handling
                    const index = state.contains('cursor', { id })
                    if (index < 0) {
                        pullquoteIndices.push({ id, type })
                    } else {
                        log.error(
                            `Duplicate [id] attribute [${id}]. [id]s must be unique ${context.filename}.md:${_line}`,
                        )
                    }

                    // parse attrs as normal
                    const attrsObject = attributesObject(attrs, type, {
                        filename,
                        lineNr,
                    })

                    // get citation which we'll use below
                    if ({}.hasOwnProperty.call(attrsObject, 'citation')) {
                        citation = attrsObject.citation
                        delete attrsObject.citation
                    }

                    const attributeStr = attributesString(attrsObject)
                    const elementName = type === 'pullquote' ? 'section' : 'blockquote'
                    const comment = `\n<!-- START: section:${type}#${id} -->\n`
                    result = `${comment}<${elementName}${attributeStr}>`
                }

                if (close) {
                    // it's an exit to a pullquote. grab the id from the list of
                    // indices
                    const { id, type } = pullquoteIndices[pullquoteIndices.length - 1]
                    const elementName = type === 'pullquote' ? 'section' : 'blockquote'

                    // check that the id matches our token
                    if (id && token.match(new RegExp(`exit:${id}`))) {
                        // it's a match for the exit directive's `id`, output the citation
                        // with the HTML comment and reset the citation to prepare for the
                        // next iteration
                        const comment = `\n<!-- END: section:${type}#${id} -->\n`

                        result = citation
                            ? `<footer><cite>&#8212;&#160;${instance.renderInline(citation)}</cite></footer>`
                            : ''
                        result += `</${elementName}>${comment}`
                        citation = ''

                        // update indices
                        pullquoteIndices.pop()
                    }
                }
            }
            return result
        },
    }),
}
