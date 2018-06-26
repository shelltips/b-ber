import {messagesTypes} from '../constants'

export default class PageEvent {
    constructor({spreadIndex, spreadTotal, firstPage, lastPage}) {
        this.type = messagesTypes.PAGINATION_EVENT
        this.spreadIndex = spreadIndex
        this.spreadTotal = spreadTotal
        this.firstPage = firstPage
        this.lastPage = lastPage
    }
}
