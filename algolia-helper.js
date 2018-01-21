const algoliaSearch = require('algoliasearch');
const algoliaClient = algoliaSearch('ZBMHT4LVLY', 'c896e4b96494692ca687ab6e995571dc')
const algoliaIndex = algoliaClient.initIndex('university-project');

exports.addToAlgolia = data =>{
    return algoliaIndex.addObject(data);
}