module.exports = {
    name: 'b-ber-parser-gallery',
    verbose: true,
    setupFilesAfterEnv: ['jest-extended'],
    testURL: 'http://localhost/',
    transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
