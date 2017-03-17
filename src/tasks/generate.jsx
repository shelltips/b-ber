
/**
 * @module generate
 */

import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import YAML from 'yamljs'
import File from 'vinyl'
import conf from '../modules/config'
import { log } from '../log'
import { orderByFileName, entries, lpad } from '../utils'

const cwd = process.cwd()

/**
 * Get a list of markdown files
 * @return {Array<Object<String>>}
 */
const getFiles = () =>
  new Promise(resolve =>
    fs.readdir(path.join(cwd, conf.src, '_markdown'), (err, files) => {
      if (err) { throw err }
      let filearr = files.map((_) => {
        if (path.basename(_).charAt(0) === '.') { return null }
        return { name: _ }
      }).filter(Boolean)
      filearr = filearr.length ? filearr : []
      resolve(filearr)
    })
  )

/**
 * Order files based on their filename
 * @param  {Array<Object<String>>} files
 * @return {Array<Object<String>>}
 */
const orderFiles = files =>
  new Promise(resolve =>
    resolve(orderByFileName(files))
  )

/**
 * Get an array of files' frontmatter
 * @param  {Array} files [description]
 * @return {Object}       The array of files and their corresponding frontmatter
 */
const parseMeta = files =>
  new Promise((resolve) => {
    const { section_title, landmark_type, landmark_title } = yargs.argv
    const metadata = { section_title, landmark_type, landmark_title }
    resolve({ files, metadata })
  })

/**
 * Create a new vinyl file object with frontmatter
 * @param  {Array} options.files
 * @param  {Object} options.metadata
 * @return {Object} The filename, the file object, and the metadata
 */
const createFile = ({ files, metadata }) => {
  let frontmatter = ''
  for (const [key, val] of entries(metadata)) {
    if (key && val) { frontmatter += `${key}: ${val}\n` }
  }
  frontmatter = `---\n${frontmatter}---\n`

  return new Promise((resolve) => {
    const fname = `${lpad(String(files.length + 1), '0', 5)}.md`
    const file = new File({
      path: './',
      contents: new Buffer(frontmatter)
    })
    resolve({ fname, file, metadata })
  })
}

/**
 * Write a vinyl file object's contents to the output directory
 * @param  {String} options.fname
 * @param  {Object} options.file  The vinyl file object
 * @return {Object}               The filename and file object
 */
const writeFile = ({ fname, file }) =>
  new Promise(resolve =>
    fs.writeFile(
        path.join(cwd, conf.src, '_markdown', fname),
        String(file.contents),
        (err) => {
          if (err) { throw err }
          resolve({ fname, file })
        })
  )

/**
 * Append a newly created filename to the yaml manifest
 * @param  {String} options.fname
 * @return {Promise<Object|Error>}
 */
const writePageMeta = ({ fname }) =>
  new Promise((resolve, reject) => {
    const buildTypes = ['epub', 'mobi', 'web', 'sample']
    let type
    while ((type = buildTypes.pop())) {
      const pages = path.join(cwd, conf.src, `${type}.yml`)
      let pagemeta = []
      try {
        if (fs.statSync(pages)) {
          pagemeta = YAML.load(path.join(cwd, conf.src, `${type}.yml`))
        }
      } catch (e) {
        log.info(`Creating ${type}.yml`)
        fs.writeFileSync(path.join(cwd, conf.src, `${type}.yml`), '---')
      }

      const index = pagemeta.indexOf(fname)
      if (index > -1) {
        log.error(`${fname} already exists in \`${type}.yml\`. Aborting`)
        reject()
      }

      fs.appendFile(pages, `\n- ${path.basename(fname, '.md')}.xhtml`, (err) => {
        if (err) { throw err }
        if (!buildTypes.length) { resolve() }
      })
    }
  })

/**
 * Create a new markdown file
 * @return {Promise<Object|Error>}
 */
const generate = () =>
  new Promise(resolve/* , reject */ =>
    getFiles()
    .then(filearr => orderFiles(filearr))
    .then(filearr => parseMeta(filearr))
    .then(resp => createFile(resp))
    .then(resp => writeFile(resp))
    .then(resp => writePageMeta(resp))
    .catch(err => log.error(err))
    .then(resolve)
  )

export default generate
