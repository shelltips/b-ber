
import MarkdownIt from 'markdown-it'
import mdFootnote from 'markdown-it-footnote'
import mdFrontMatter from 'markdown-it-front-matter'
import mdSection from './md-directives/md-section'
import mdExit from './md-directives/md-exit'
import mdImages from './md-directives/md-images'
import mdDialogue from './md-directives/md-dialogue'
import { updateStore } from './utils'

class MarkIt {
  constructor() {
    const md = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false
    })

    md
    .use(
      mdSection.plugin,
      mdSection.name,
      mdSection.renderer(md, this))
    .use(
      mdExit.plugin,
      mdExit.name,
      mdExit.renderer(md, this))
    .use(
      mdFootnote)
    .use(
      mdImages.plugin,
      mdImages.name,
      mdImages.renderer(md, this))
    .use(
      mdDialogue.plugin,
      mdDialogue.name,
      mdDialogue.renderer(md, this))
    .use(
      mdFrontMatter,
      meta => this.noop())

    this._set = function _set(key, val) {
      this[key] = val
      return this[key]
    }

    this._get = function _get(key) {
      return this[key]
    }

    this.filename = null
    this.noop = function noop() {}

    this.template = function template(meta) {
      const str = meta.split('\n').map(_ => `  ${_}`).join('\n')
      return `-\n  filename: ${this._get('filename')}\n${str}\n`
    }

    this.render = function render(filename, data) {
      this._set('filename', filename)
      updateStore('pages', { filename })
      return md.render(data)
    }

    this.setup = function setup() {
      return Promise.resolve()
    }
  }
}

export default new MarkIt()
