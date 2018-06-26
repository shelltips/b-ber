const localConfig = (_ => {
    let _config = {}
    if (/^localhost/.test(window.location.host) === false) return _config

    try { _config = require('../.localconfig') } // eslint-disable-line global-require
    catch (err) { /* noop */ }
    return _config
})()

module.exports = {
    debug: false,                   // 'colorizes' elements. useful for work on spreads/markers
    useLocalStorage: true,          // load/save data from localStorage
    verboseOutput: false,           // log level
    ...localConfig,                 // user opts
}
