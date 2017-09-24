import chalk from 'chalk'
import { EventEmitter } from 'events'

class Timer extends EventEmitter {

    static dateFormattingOptions = {
        day    : 'numeric',
        month  : 'short',
        year   : 'numeric',
        hour   : 'numeric',
        minute : 'numeric',
        second : 'numeric',
    }

    constructor() {
        super()

        this.taskBegin          = null
        this.taskEnd            = null

        this.sequenceBegin      = null
        this.formattedStartDate = null
        this.taskTimes          = null


        this.prepare()

    }

    hrtimeformat(t) {
        const s = (t[0] * 1000) + (t[1] / 1000000)
        return `${String(s).slice(0, -3)}ms`
    }


    prepare() {
        this.sequenceBegin = process.hrtime()
        this.formattedStartDate = new Date().toLocaleDateString('en-CA', Timer.dateFormattingOptions)

        this.taskTimes = []
    }
    start(task) {
        this.taskBegin = process.hrtime(this.sequenceBegin)
        this.emit('begin', { task, begin: this.taskBegin })
    }

    stop(task) {
        this.taskEnd = process.hrtime(this.sequenceBegin)

        const beginMs = this.hrtimeformat(this.taskBegin)
        const endMs   = this.hrtimeformat(this.taskEnd)
        const totalMs = `${(parseFloat(endMs, 10) - parseFloat(beginMs, 10)).toFixed(3)}ms`


        const taskTime = {
            taskName: task,
            beginHrtime: this.taskBegin,
            endHrtime: this.taskEnd,
            beginMs,
            endMs,
            totalMs,
        }

        this.taskTimes.push(taskTime)


        this.emit('end', { task, taskTime })

    }


    done() {

        const { taskTimes, formattedStartDate } = this
        const formattedEndDate = new Date().toLocaleDateString('en-CA', Timer.dateFormattingOptions)
        const sequenceEnd = this.hrtimeformat(process.hrtime(this.sequenceBegin))

        this.emit('done', { taskTimes, formattedStartDate, formattedEndDate, sequenceEnd })

    }
}

export default Timer