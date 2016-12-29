
import yargs from 'yargs'
import path from 'path'
import https from 'https'
import decompress from 'decompress'

import conf from './config'
import log from './log'

const cwd = process.cwd()

let dest
const setDest = () => {
  dest = path.join(cwd, yargs.argv.path)
  return dest
}

const download = () =>
  new Promise((resolve, reject) => {
    const chunks = []
    return https.get(conf.gomez, (resp) => {
      if (resp.statusCode !== 200) { reject('Could not connect to the server') }
      resp.on('error', err => reject(err))
      resp.on('data', chunk => chunks.push(chunk))
      resp.on('end', () => resolve(Buffer.concat(chunks)))
    })
  })

function site() {
  setDest()
  return new Promise((resolve, reject) => {
    if (!{}.hasOwnProperty.call(conf, 'gomez')) { reject(new Error('No download url.')) }
    download()
    .then(data => decompress(data, dest, { strip: 1 }))
    .catch(err => log.error(err))
    .then(resolve)
  })
}

export default site
