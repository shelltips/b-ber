import fs from 'fs-extra'
import path from 'path'
import figure from 'bber-plugins/md/plugins/figure'
import { attributesString, attributesObject, htmlId } from 'bber-plugins/md/directives/helpers'
import { /*htmlComment, */src } from 'bber-utils'
import { log } from 'bber-plugins'

const markerRe = /^logo/
const directiveRe = /(logo)(?::([^\s]+)(\s?.*)?)?$/

export default {
  plugin: figure,
  name: 'logo',
  renderer: () => ({
    marker: ':',
    minMarkers: 3,
    validate(params) {
      return params.trim().match(markerRe)
    },
    render(tokens, idx) {
      const match = tokens[idx].info.trim().match(directiveRe)
      const [, type, id, attrs] = match

      const attrsObj = attributesObject(attrs, type)

      if (!attrsObj.source) {
        log.error('[source] attribute is required by [logo] directive, aborting', 1)
      }

      const inputImagePath = path.join(src(), '_images', attrsObj.source)
      const outputImagePath = `../images/${attrsObj.source}`

      try {
        if (!fs.existsSync(inputImagePath)) {
          throw new Error(`Image [${attrsObj.source}] does not exist, aborting`)
        }
      } catch (err) {
        log.error(err, 1)
      }

      delete attrsObj.source // since we need the path relative to `images`
      const attrString = attributesString(attrsObj, type)

      return `
        <figure id="${htmlId(id)}" class="logo">
          <img style="width:120px;" src="${outputImagePath}" ${attrString}/>
        </figure>`
    },
  }),
}
