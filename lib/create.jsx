
import fs from 'fs-extra'
import path from 'path'
import log from './log'
import conf from './config'
import { container, mimetype } from './templates'

const cwd = process.cwd()
const dirs = [
  path.join(cwd, `${conf.dist}/OPS`),
  path.join(cwd, `${conf.dist}/META-INF`)
]

const write = () =>
  new Promise((resolve, reject) =>
    fs.writeFile(path.join(cwd, `${conf.dist}/META-INF/container.xml`), container, (err1) => {
      if (err1) { reject(err1) }
      fs.writeFile(path.join(cwd, `${conf.dist}/mimetype`), mimetype, (err2) => {
        if (err2) { reject(err2) }
        resolve()
      })
    })
  )

const makedirs = () =>
  new Promise((resolve, reject) =>
    dirs.map((dir, index) =>
      fs.mkdirs(dir, (err) => {
        if (err) { reject(err) }
        if (index === dirs.length - 1) { resolve() }
      })
    )
  )

const create = () =>
  new Promise((resolve, reject) => {
    try {
      if (fs.statSync(path.join(cwd, conf.src))) {
        makedirs()
        .then(write)
        .catch(err => log.error(err))
        .then(resolve)
      }
    } catch (e) {
      reject(new Error(`${conf.src} directory does not exist.`))
    }
  })

export default create
