/* eslint-disable max-len */
/*

@type: epigraph
@usage:
    + epigraph image "image.jpg"

    + epigraph caption "This is the first caption | This is the second caption" citation "first citation | second citation"

@output: <section epub:type="epigraph" class="epigraph chapter"> ... </section>

*/

import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-parser-figure'

const markerRe = /^epigraph/
const attrsRe = /(?:(image|caption|citation)\s["]([^"]+)["])/g

export default {
  plugin: figure,
  name: 'epigraph',
  renderer: ({ instance, context = { fileName: '' } }) => ({
    marker: ':',
    minMarkers: 3,
    validate(params) {
      return params.trim().match(markerRe)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.escapeHtml
      const attrs = { image: '', caption: '', citation: '' }
      let result = ''
      if (tokens[idx].nesting === 1) {
        // opening tag
        let matches
        while ((matches = attrsRe.exec(tokens[idx].info.trim())) !== null) {
          // eslint-disable-next-line prefer-destructuring
          attrs[matches[1]] = matches[2]
        }

        if (!attrs.image && !attrs.caption) {
          log.error(`[${context.fileName}.md] <epigraph> Malformed directive.`)
          result = ''
        } else if (!attrs.image && attrs.caption) {
          const captions = attrs.caption.split('|').map(_ => _.trim())
          const citations = attrs.citation.split('|').map(_ => _.trim())
          result = [
            '<section epub:type="epigraph" class="epigraph chapter">',
            '<section epub:type="chapter" class="subchapter">',
            captions
              .map(
                (caption, idx2) =>
                  `<div class="pullquote full-width">
                                <p>${escapeHtml(caption)}</p>
                                ${
                                  citations[idx2]
                                    ? `<cite>&#x2014;${escapeHtml(
                                        citations[idx2]
                                      )}</cite>`
                                    : ''
                                }
                            </div>`
              )
              .join(''),
            '</section>',
            '</section>',
          ].join('')
        } else {
          result = [
            '<section epub:type="epigraph" class="epigraph chapter">',
            '<div class="figure-lg" style="height: auto;">',
            '<figure style="height: auto;">',
            '<div class="figure__items" style="width: 100%; margin: 0 auto;">',
            `<img class="landscape" alt="${
              attrs.image
            }" src="../images/${escapeHtml(
              attrs.image
            )}" style="width: 100%; max-width: 100%; height: auto;"/>`,
            attrs.caption
              ? `<div class="figcaption" style="width: 100%; max-width: 100%; height: auto;"><p class="small">${escapeHtml(
                  attrs.caption
                )}</p></div>`
              : '',
            '</div>',
            '</figure>',
            '</div>',
            '</section>',
          ].join('')
        }
      }
      return result
    },
  }),
}
