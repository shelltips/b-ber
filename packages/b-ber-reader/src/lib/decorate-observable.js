/* eslint-disable no-param-reassign,prefer-rest-params */

import debounce from 'lodash/debounce'
import ResizeObserver from 'resize-observer-polyfill'
import { isNumeric } from '../helpers/Types'
import { debug, verboseOutput, logTime } from '../config'
import browser from '../lib/browser'

// speeds to debounce our mutation and resize observer callbacks. making sure
// the document is laid out before rendering
const ENSURE_RENDER_TIMEOUT = 200
const DEBOUNCE_TIMER = 200

const log = (lastIndex, contentDimensions, frameHeight, columns) => {
    if (debug && verboseOutput) {
        console.group('Layout#connectResizeObserver')
        console.log(
            'lastIndex: %d; contentDimensions: %d; frameHeight %d; columns %d',
            lastIndex,
            contentDimensions,
            frameHeight,
            columns,
        ) // eslint-disable-line indent
        console.groupEnd()
    }
}

export default function observable(target) {
    const _componentWillMount = target.prototype.componentWillMount

    target.prototype.componentWillMount = function componentWillMount() {
        this.__observerableTimer = null
        this.__contentDimensions = 0
        this.__resizeObserver = null
        this.__mutationObserver = null

        if (_componentWillMount) _componentWillMount.call(this, arguments)
    }

    const _componentDidMount = target.prototype.componentDidMount
    target.prototype.componentDidMount = function componentDidMount() {
        this.calculateNodePositionAfterResize = debounce(this.calculateNodePosition, DEBOUNCE_TIMER, {
            leading: false,
            trailing: true,
        }).bind(this)

        this.calculateNodePositionAfterMutation = debounce(this.calculateNodePosition, DEBOUNCE_TIMER, {
            leading: false,
            trailing: true,
        }).bind(this)

        if (_componentDidMount) _componentDidMount.call(this, arguments)

        this.observe()
    }

    const _componentWillUnmount = target.prototype.componentWillUnmount
    target.prototype.componentWillUnmount = function componentWillUnmount() {
        this.unobserve()

        if (_componentWillUnmount) _componentWillUnmount.call(this, arguments)
    }

    target.prototype.connectResizeObserver = function connectResizeObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")

        this.__resizeObserver = new ResizeObserver(this.calculateNodePositionAfterResize)
        this.__resizeObserver.observe(this.contentNode)
    }

    target.prototype.connectMutationObserver = function connectMutationObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")

        this.__mutationObserver = new window.MutationObserver(this.calculateNodePositionAfterMutation)
        this.__mutationObserver.observe(this.contentNode, { attributes: true, subtree: true })
    }

    target.prototype.disconnectResizeObserver = function disconnectResizeObserver() {
        this.__resizeObserver.disconnect()
    }

    target.prototype.disconnectMutationObserver = function disconnectMutationObserver() {
        this.__mutationObserver.disconnect()
    }

    target.prototype.unobserveResizeObserver = function unobserveResizeObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")
        this.__resizeObserver.unobserve(this.contentNode)
    }

    target.prototype.unobserveMutationObserver = function unobserveMutationObserver() {
        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")
        this.__mutationObserver.disconnect(this.contentNode)
    }

    target.prototype.calculateNodePosition = function calculateNodePosition(entry) {
        console.log('mutates', entry)

        if (!this.contentNode) throw new Error("Couldn't find this.contentNode")

        const { columns } = this.state

        let contentDimensions
        let lastIndex
        let frameHeight

        // TODO: prevent multiple callbacks. good to have this off for debug
        // if (this.props.ready === true) return

        if (logTime) console.time('observable#setReaderState')

        // total height of document as though it were laid out vertically.
        // ensure we're getting the largest value
        if (browser.name === 'firefox') {
            const frame = document.getElementById('frame')
            const layout = document.getElementById('layout')

            // FF only. we need to find the document height, but firefox
            // interprets our column layout as having width, so we toggle the
            // column view to get our dimensions
            frame.style.overflow = 'scroll'
            layout.style.columns = 'auto'

            contentDimensions = Math.max(
                this.contentNode.scrollHeight,
                this.contentNode.offsetHeight,
                this.contentNode.clientHeight,
            )

            frame.style.overflow = 'hidden'
            layout.style.columns = '2 auto' // TODO: reset using options
        } else {
            contentDimensions = Math.max(
                this.contentNode.scrollHeight,
                this.contentNode.offsetHeight,
                this.contentNode.clientHeight,
            )
        }

        // height of the reader frame (viewport - padding top and bottom),
        // rounded so we get a clean divisor
        frameHeight = this.getFrameHeight()

        // getFrameHeight will return 'auto' for mobile. set to zero so that
        // chapter navigation still works
        if (!isNumeric(frameHeight)) frameHeight = 0
        frameHeight = Math.round(frameHeight)

        // find the last index by dividing the document length by the frame
        // height, and then divide the result by 2 to account for the 2
        // column layout. Math.ceil to only allow whole numbers (each page
        // must have 2 columns), and to account for dangling lines of text
        // that will spill over to the next column (contentDimensions /
        // frameHeight in these cases will be something like 6.1 for a
        // six-page chapter). minus one since we want it to be a zero-based
        // index
        lastIndex = Math.ceil(contentDimensions / frameHeight / 2) - 1

        // never less than 0
        lastIndex = lastIndex < 0 ? 0 : lastIndex

        log(lastIndex, contentDimensions, frameHeight, columns)

        // check that everything's been added to the DOM. if there's a disparity
        // in dimensions, hide then show content to trigger our resize
        // observer's callback
        if (this.__contentDimensions !== contentDimensions) {
            window.clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                this.__contentDimensions = contentDimensions

                log(lastIndex, contentDimensions, frameHeight, columns)

                this.contentNode.style.display = 'none'
                this.contentNode.style.display = 'block'
            }, ENSURE_RENDER_TIMEOUT)
        } else {
            if (logTime) console.timeEnd('observable#setReaderState')
            this.props.setReaderState({ lastIndex, ready: true })
        }
    }

    target.prototype.observe = function observe() {
        this.connectResizeObserver()
        this.connectMutationObserver()
    }

    target.prototype.unobserve = function unobserve() {
        this.unobserveResizeObserver()
        this.unobserveMutationObserver()
    }

    target.prototype.disconnect = function disconnect() {
        this.disconnectResizeObserver()
        this.disconnectMutationObserver()
    }
}
