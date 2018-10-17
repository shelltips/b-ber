import { cover } from '@canopycanopycanopy/b-ber-tasks'
import { fail } from '../helpers'

const command = 'cover'
const describe = 'Generate a project cover'
const builder = yargs =>
    yargs
        .options({})
        .fail((msg, err) => fail(msg, err, yargs))
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 cover\n\n${describe}`)

const handler = () => cover.init()

export default {
    command,
    describe,
    builder,
    handler,
}
