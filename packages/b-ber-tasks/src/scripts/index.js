
import path from 'path'
import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import uglifyJS from 'uglify-js'

const uglifyOptions = state.config.uglify_options || {
    warnings: true,
    compress: {
        dead_code: true,
        conditionals: true,
        booleans: true,
        warnings: true,
    },
}


const uglify = files => {
    const result = uglifyJS.minify(files, uglifyOptions)
    if (result.error) throw result.error
    if (result.warnings) log.warn(result.warnings)
    return result.code
}

const optimized = files =>
    new Promise(resolve => {
        const contents = files.map(_ => fs.readFileSync(path.join(state.src, '_javascripts', _), 'utf8'))
        const js = uglify(contents)
        const {hash} = state
        const out = path.join(state.dist, 'OPS', 'javascripts', `${hash}.js`)
        fs.writeFile(out, js, err => {
            if (err) throw err
            log.info('Wrote [%s]', `javascripts${path.sep}${path.basename(out)}`)
            resolve()
        })
    })

const unoptimized = files => {
    const promises = []
    return new Promise(resolve => {
        files.forEach(file => {
            promises.push(new Promise(resolve => {
                const out = path.join(state.dist, 'OPS', 'javascripts', file)
                fs.copy(path.join(state.src, '_javascripts', file), out, err => {
                    if (err) throw err
                    log.info('Wrote [%s]', `javascripts${path.sep}${path.basename(out)}`)
                    resolve()
                })
            }))
        })
        Promise.all(promises).then(resolve)
    })
}


const write = () =>
    new Promise(resolve => {
        const promises = []
        fs.readdir(path.join(state.src, '_javascripts'), (err, _files) => {
            if (err) throw err
            const files = _files.filter(_ => path.extname(_) === '.js')
            promises.push((state.env === 'production' ? optimized : unoptimized)(files))
            Promise.all(promises).then(resolve)
        })
    })


const ensureDir = () =>
    new Promise(resolve =>
        fs.mkdirp(path.join(state.dist, 'OPS', 'javascripts'), err => {
            if (err) throw err
            resolve()
        })
    )

const scripts = () =>
    new Promise(resolve =>
        ensureDir()
        .then(write)
        .catch(err => log.error(err))
        .then(resolve)
    )

export default scripts