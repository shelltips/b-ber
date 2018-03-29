import path from 'path'
import {container} from '@canopycanopycanopy/b-ber-tasks'
import log from '@canopycanopycanopy/b-ber-logger'
import {fail} from '../helpers'

const command = 'container'
const describe = 'Create an Epub directory structure'
const builder = yargs =>
    yargs
        .options({
            i: {
                alias: 'in',
                describe: 'New src directory path',
                default: '',
                type: 'string',
            },
            o: {
                alias: 'out',
                describe: 'New dist directory path',
                default: '',
                type: 'string',
            },
        })
        .fail((msg, err) => fail(msg, err, yargs))
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 container\n\n${describe}`)


const handler = argv => {
    const i = argv.i
    const o = argv.o
    if (!i.length || !o) throw new Error('Both src and dist directories must be provided')
    return container(i, o).then(() =>
        log.info(`Created src: [${path.basename(i)}] and dist: [${path.basename(o)}]`)
    )
}

export default {
    command,
    describe,
    builder,
    handler,
}