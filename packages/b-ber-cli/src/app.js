/* eslint-disable no-shadow, no-console, no-unused-vars, no-unused-expressions */
/**
 * @module cli
 */

import yargs from "yargs"
import log from "@canopycanopycanopy/b-ber-logger"
import state from "@canopycanopycanopy/b-ber-lib/State"
import createBuildSequence from "@canopycanopycanopy/b-ber-shapes/create-build-sequence"
import sequences from "@canopycanopycanopy/b-ber-shapes/sequences"
import * as commands from "./cmd"

const lineLength = 70

/**
 * Start the build
 * @memberOf module:cli
 * @return {Object}
 */
export default function bber() {
    /**
     * Shows custom help if a CLI command fails
     * @return {String}
     */
    const showCustomHelp = () =>
        console.log(`
    Usage: bber <command> [options]

    Where <command> is one of:

    ${Object.keys(commands)
        .sort()
        .reduce((acc, curr) => {
            const a = acc.split("\n")
            const l = a[a.length - 1].length
            return acc.concat(l > lineLength ? `\n    ${curr}, ` : `${curr}, `)
        }, "")
        .slice(0, -2)}

    Some common commands are:

        bber new        Start a new project
        bber generate   Create a new chapter. Accepts arguments for metadata.
        bber serve      Preview the publication's contents in a browser
        bber build      Create an ePub, mobi, PDF, or all file formats

    For more information on a command, enter bber <command> --help

    bber version ${state.version}
`)

    /**
     * checkCommands
     * @param  {Object} yargs Yargs module
     * @return {Object|Error}
     */
    const checkCommands = ({ argv }) => {
        const command = argv._[0]

        if (!{}.hasOwnProperty.call(commands, command)) {
            showCustomHelp()
            process.exit(0)
        }

        const sequence =
            command === "build"
                ? createBuildSequence(argv).reduce(
                    (a, c) => a.concat(...sequences[c]),
                    []
                )
                : [command]

        state.update("sequence", sequence)
        log.registerSequence(state, command, sequence)
    }

    checkCommands(yargs)

    yargs
        .fail((msg, err, yargs) => {
            console.log(msg)
            showCustomHelp()
            console.log(err.stack)
            process.exit(1)
        })

        .command(commands.build)
        .command(commands.generate)
        .command(commands.opf)
        .command(commands.theme)
        .command(commands.serve)
        .command(commands.xml)
        .command(commands.new)
        .command(commands.cover)
        .command(commands.deploy)

        .help("h")
        .alias("h", "help")
        .demandCommand()
        .wrap(lineLength).argv
}
