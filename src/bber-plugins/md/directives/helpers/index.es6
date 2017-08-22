// import crypto from 'crypto'
import { forOf } from 'bber-utils'
import { log } from 'bber-plugins'
import {
  BLOCK_DIRECTIVES,
  INLINE_DIRECTIVES,
  MISC_DIRECTIVES,
  FRONTMATTER_DIRECTIVES,
  BODYMATTER_DIRECTIVES,
  BACKMATTER_DIRECTIVES,
  ALL_DIRECTIVES,
  DIRECTIVES_REQUIRING_ALT_TAG,
  SUPPORTED_ATTRIBUTES,
} from 'bber-shapes/directives'


//
// querying hierarchies gets confusing, so we're using biological taxonomic
// rank as an analogue for classification. which is obvs less confusing...
//
// Class    -> Order  -> Family       -> Genus
// element  -> block  -> frontmatter  -> preface
//


const _lookUpFamily = genus =>
  FRONTMATTER_DIRECTIVES.indexOf(genus) > -1 ? 'frontmatter' :
  BODYMATTER_DIRECTIVES.indexOf(genus) > -1 ? 'bodymatter' :
  BACKMATTER_DIRECTIVES.indexOf(genus) > -1 ? 'backmatter' :
  ''

/**
 * Determine the directive's classification and parent's type
 * @param  {String}           genus [description]
 * @return {Object<String>}
 */
const _directiveOrder = genus =>
  BLOCK_DIRECTIVES.indexOf(genus) > -1 ? 'block' :
  INLINE_DIRECTIVES.indexOf(genus) > -1 ? 'inline' :
  MISC_DIRECTIVES.indexOf(genus) > -1 ? 'misc' :
  null

const _requiresAltTag = genus =>
  DIRECTIVES_REQUIRING_ALT_TAG.indexOf(genus) > -1

const _isUnsupportedAttribute = attr =>
  SUPPORTED_ATTRIBUTES.indexOf(attr) < 0

const _applyTransforms = (k, v) => {
  switch (k) {
    case 'classes':
      return ` class="${v}"`
    case 'epubTypes':
      return ` epub:type="${v}"`
    case 'pagebreak':
      return ` style="page-break-${v}:always;"`
    case 'attrs':
      return ''
    case 'source':
      return ` src="${v}"`

    // boolean attrs for audio/video elements
    case 'autoplay':
    case 'muted':
    case 'controls':
    case 'autobuffer':
    case 'loop':
      return v === 'yes' ? ` ${k}="${k}"` : ''

    default:
      return ` ${k}="${v}"`
  }
}


// MarkdownIt returns a trimmed string of the directive's attributes, which
// are parsed and transformed into a string of HTML attributes
//
//    ::: directive:id classes:"foo bar baz" page-break-before:yes
//    -> ' classes:"foo bar baz" page-break-before:yes'
//    -> { classes:"foo bar baz", "page-break-before":"yes" }
//    -> class="foo bar baz" style="page-break-before:true;"
//
const _parseAttrs = (s) => {

  const out = {}

  let str = ''
  let open
  let delim
  let char
  let next
  let key

  for (let i = 0; i < s.length; i++) {
    char = s[i].charCodeAt(0)
    next = s[i + 1] ? s[i + 1].charCodeAt(0) : ''

    if (!open && char === 58/* : */) { // char is a token, we set `open` so that we don't misinterpret literals inside quotations
      open = true
      key = str
      str = ''
      delim = 32/*   */
      if (next === 34/* " */ || next === 39/* ' */) { i++; delim = next }
      continue
    }

    if (char === delim) { // token is ending delimiter since we've advanced our pointer
      key = key.trim() // trim whitespace, allowing for multiple spaces
      out[key] = str
      str = key = ''
      open = delim = null
      continue
    }

    str += s[i]

    if (i === s.length - 1) { // end of line
      if (key && key.length && str && str.length) {
        out[key] = str
      }
    }
  }

  return out
}

// -> prop="val"
const _buildAttrString = (obj) => {
  let s = ''
  forOf(obj, (k, v) => {
    s += _applyTransforms(k, v)
  })

  return s
}


/**
 * Ensure that attributes required for valid XHTML are present, and that
 * system defaults are merged into user settings
 * @param  {Object} obj  [description]
 * @param  {String} name [description]
 * @return {Object}
 */
const _extendWithDefaults = (obj, genus) => {
  const result = { ...obj }
  const order = _directiveOrder(genus)
  if (!order) { throw new TypeError(`Invalid directive type: [${genus}]`) }

  let taxonomy
  switch (order) {

    case 'block':
      taxonomy = `${_lookUpFamily(genus)} ${genus}`     // -> `bodymatter chapter`
      result.epubTypes = taxonomy
      if ({}.hasOwnProperty.call(obj, 'classes')) {
        result.classes += ` ${taxonomy}`                // -> class="... bodymatter chapter"
      } else {
        result.classes = taxonomy                       // -> class="bodymatter chapter"
      }
      return result

    case 'inline':
      if (_requiresAltTag(genus)) {
        if (!{}.hasOwnProperty.call(obj, 'alt')) {
          result.alt = result.source
        }
      }

      return result

    case 'misc':
    default:
      return result
  }
}

/**
 * Create an object from attributes in the given directive
 * @param  {String} attrs   The directives attributes string
 * @param  {String} genus   The type of directive
 * @param  {Object} context Markdown file where attributes method was called
 * @return {String}
 */
const attributesObject = (attrs, genus, context = {}) => {
  const { filename, lineNr } = context
  let attrsObject = {}

  if (!genus || typeof genus !== 'string') {
    log.error(`No directive provided: ${filename}:${lineNr}`, 1)
  }

  if (ALL_DIRECTIVES.indexOf(genus) < 0) {
    log.error(`Invalid directive: [${genus}] at ${filename}:${lineNr}`, 1)
  }

  if (attrs && typeof attrs === 'string') {
    forOf(_parseAttrs(attrs.trim()), (k, v) => {
      if (_isUnsupportedAttribute(k)) {
        return log.warn(`Omitting illegal attribute [${k}] at [${filename}:${lineNr}]`)
      }

      attrsObject[k] = v
    })
  }

  const mergedAttrs = _extendWithDefaults(attrsObject, genus)
  return mergedAttrs
}

/**
 * Create a string of attributes for an XHTML element
 * @param  {Object} obj An attributes object
 * @return {String}
 */
const attributesString = obj => _buildAttrString(obj)

/**
 * Convenience wrapper for creating attributes: String -> Object -> String
 * @param  {String} str     [description]
 * @param  {String} type    [description]
 * @param  {Object} context Markdown file where attributes method was called
 * @return {String}
 */
const attributes = (str, type, context) => _buildAttrString(attributesObject(str, type, context))

/**
 * [description]
 * @param  {String} s [description]
 * @return {String}
 */
const htmlId = s =>
  `_${String(s).replace(/[^0-9a-zA-Z-_]/g, '_')}`//-${crypto.createHash('md5').update(s).digest('hex')}`


export { attributes, attributesObject, attributesString, htmlId }
