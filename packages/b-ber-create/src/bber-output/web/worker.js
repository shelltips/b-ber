/* eslint-disable */

//
// This file is written as-is to `project-web` on `bber build --web`.
// It manages the WebWorker for search.
//

importScripts('/lunr.js');
var searchIndex;
var records = [];
var readyState = 0;

function onRequestReadyStateChange(state = null) {
    readyState = state || this.readyState;
    postMessage({ readyState: readyState });
}
function onRequestLoad() {
    records = JSON.parse(this.responseText);
    searchIndex = lunr(function() {
        this.metadataWhitelist = ['position'];

        this.field('title');
        this.field('body');
        this.ref('id');

        records.forEach(function(record, i) {
            this.add(record);
        }, this);
    });

    onRequestReadyStateChange(this.readyState);
}

function getSearchIndex() {
    var req = new XMLHttpRequest();
    req.addEventListener('load', onRequestLoad);
    req.addEventListener('open', onRequestReadyStateChange);
    req.addEventListener('send', onRequestReadyStateChange);
    req.open('GET', '/search-index.json');
    req.send();
}

function trimResultBody(data) {
    return data;
}

function parseSearchResults(results) {
    var output = [];
    var markerStart = '<mark>';
    var markerEnd = '</mark>';
    var markerLength = markerStart.length + markerEnd.length;
    var markerOffset = 0; // account for the marker tags length
    var resultsObject = {}; // list of results; iterated over in worker-init.js
    var text = ''; // found text
    var textOffset = 100; // number of chars before and after match to append to each result for context

    if (!results || !results.length) { return output; }
    results.forEach(function(result) {
        Object.keys(result.matchData.metadata).forEach(function (term) {
            resultsObject = {};
            resultsObject.url = records[result.ref].url;

            Object.keys(result.matchData.metadata[term]).forEach(function (fieldName) {
                var text = '';
                var lastIndex = 0;

                for (var i = 0; i < result.matchData.metadata[term][fieldName].position.length; i++) {
                    var begin = result.matchData.metadata[term][fieldName].position[i][0];
                    var length = result.matchData.metadata[term][fieldName].position[i][1];

                    lastIndex = begin - textOffset;

                    var prefix = lastIndex > 0 ? '...' : '';
                    var before = records[result.ref][fieldName].slice(lastIndex, begin);
                    var marked = markerStart + records[result.ref][fieldName].slice(begin, begin + length) + markerEnd;
                    var after = records[result.ref][fieldName].slice(begin + length, begin + length + textOffset);
                    var suffix = begin + length + textOffset > records[result.ref][fieldName].length ? '' : '...';


                    text += '<span class="search__result__text">' + prefix + before + marked + after + suffix + '</span>';
                    lastIndex = begin + length;
                }

                resultsObject[fieldName] = text;
            });

            output.push(resultsObject)
        });
    });

    return output;
}

function doSearch(query) {
    var results = searchIndex.search(query);
    var data = parseSearchResults(results)
    return data;
}

getSearchIndex();

onmessage = function(e) {
    if (readyState < 4) { return; }
    var results = doSearch(e.data.query);
    postMessage({ results: results });
}