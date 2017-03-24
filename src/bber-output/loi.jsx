
/**
 * @module loi
 */

import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import { dist, build } from 'bber-utils'
import figure from 'bber-templates/figures'
import { page, loiLeader } from 'bber-templates/pages'

let output
let buildEnv
const initialize = () => {
  output = dist()
  buildEnv = build()
}

const createLOILeader = () =>
  new Promise((resolve, reject) => {
    const filename = 'loi-0000'
    const markup = renderLayouts(new File({
      path: './.tmp',
      layout: 'page',
      contents: new Buffer(loiLeader())
    }), { page }).contents.toString()
    fs.writeFile(path.join(`${output}/OPS/text/${filename}.xhtml`), markup, 'utf8', (err) => {
      if (err) { reject(err) }
      store.add('pages', {
        filename,
        title: 'List of Illustrations',
        type: 'loi'
      })
      resolve()
    })
  })

const createLOI = () =>
  new Promise((resolve, reject) => {
    store.images.forEach((data, idx) => {
      // Create image string based on dimensions of image, returns square |
      // landscape | portrait | portraitLong
      const imageStr = figure(data, buildEnv)
      const markup = renderLayouts(new File({
        path: './.tmp',
        layout: 'page',
        contents: new Buffer(imageStr)
      }), { page }).contents.toString()
      fs.writeFile(path.join(`${output}/OPS/text`, data.page), markup, 'utf8', (err) => {
        if (err) { reject(err) }
        if (idx === store.images.length - 1) { resolve() }
      })
    })
  })

const loi = () =>
  new Promise(async (resolve/* , reject */) => {
    if (store.images.length) {
      await initialize()
      createLOILeader()
      .then(createLOI)
      .catch(err => log.error(err))
      .then(resolve)
    } else {
      resolve()
    }
  })

export default loi
