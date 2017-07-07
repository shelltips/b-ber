
import * as figures from 'bber-templates/figures'
import * as pages from 'bber-templates/pages'
import * as opf from 'bber-templates/opf'

const container = `<?xml version="1.0"?>
  <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
      <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
  </container>`

const mimetype = 'application/epub+zip'
const scriptTag = '<script type="application/javascript" src="{% body %}"></script>'
const stylesheetTag = '<link rel="stylesheet" type="text/css" href="{% body %}"/>'
const jsonLDTag = '<script type="application/ld+json">{% body %}</script>'

export { container, mimetype, scriptTag, stylesheetTag, pages, figures, opf, jsonLDTag }
