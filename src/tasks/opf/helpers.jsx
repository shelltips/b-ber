
import path from 'path'
import fs from 'fs-extra'
import { isObject, isArray, remove, findIndex, find } from 'lodash'
import Json2XML from '../../modules/json2xml'
import { opspath, dist } from '../../utils'
import store from '../../state/store'

const cwd = process.cwd()

const pathInfoFromFile = (file, dest) => ({
  rootpath: file,
  opspath: opspath(file, dest),
  name: path.basename(file),
  extension: path.extname(file)
})

const pathInfoFromFiles = (arr, dest) =>
  arr.map(file => pathInfoFromFile(file, dest))

const flattenYamlEntries = (arr, result = []) => {
  if (isArray(arr)) {
    arr.forEach((_) => {
      if (isObject(_)) {
        flattenYamlEntries(_[Object.keys(_)[0]], result)
      } else {
        result.push(_)
      }
    })
  }
  return result
}

const removeNestedArrayItem = (arr, itemName) => {
  if (isArray(arr)) {
    remove(arr, a => a === itemName)
    arr.forEach((b) => {
      if (isObject(b)) {
        removeNestedArrayItem(b[Object.keys(b)[0]], itemName)
      }
    })
  }
  return arr
}

const createPagesMetaYaml = (input, buildType, arr = []) =>
  fs.writeFile(
    path.join(input, `${buildType}.yml`),
    `---\n${arr.map(_ => `- ${_}.xhtml`).join('\n')}`,
    (err) => { if (err) { throw err } }
  )

const buildNavigationObjects = (data, dest, result = []) => {
  data.forEach((_) => {
    if (Json2XML.isObject(_) && {}.hasOwnProperty.call(_, 'section')) {
      const childIndex = (result.push([])) - 1
      buildNavigationObjects(_.section, dest, result[childIndex])
    } else {
      // TODO: there should be more complete file info in `store.pages`, e.g.,
      // full path
      const ref = find(store.pages, { filename: path.basename(_, '.xhtml') })
      let textPath = 'text'
      if (!ref && _ === 'toc.xhtml') { textPath = '' }
      result.push({
        filename: _,
        name: path.basename(_, '.xhtml'),
        rootpath: path.join(cwd, dist(), 'OPS', textPath, _),
        opspath: path.resolve(`/${textPath}/${_}`),
        extension: path.extname(_),
        section_title: ref ? (ref.section_title || '') : '',
        landmark_type: ref ? (ref.landmark_type || '') : '',
        landmark_title: ref ? (ref.landmark_title || '') : ''
      })
    }
  })

  return result
}

const nestedLinearContent = (pages) => {
  const _pages = Array.prototype.slice.call(pages, 0)
  const nonLinearIndex = findIndex(_pages, 'nonLinear')
  _pages.splice(nonLinearIndex, 1)
  return _pages
}


export { pathInfoFromFiles, flattenYamlEntries, removeNestedArrayItem,
  createPagesMetaYaml, buildNavigationObjects, nestedLinearContent }
