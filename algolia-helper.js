const _ = require('lodash');
const algoliaSearch = require('algoliasearch');
const algoliaClient = algoliaSearch('ZBMHT4LVLY', 'c896e4b96494692ca687ab6e995571dc')
const algoliaIndex = algoliaClient.initIndex('university-project');

algoliaIndex.setSettings({
    searchableAttributes:[
        'objectID'
    ],

    attributesForFaceting: [
        'menu.graduate',
        'menu.undergraduate'
    ]
});


exports.addToAlgolia = data =>{
    return algoliaIndex.addObject(data);
}

exports.getMenu = category =>{
    const facet = (category=='graduate')? 'menu.graduate':'menu.undergraduate';

    return algoliaIndex.search('',{
        facets : facet
    }).then((content)=>{
        console.log('>>>'+content);
        const facetResults = content.facets[facet];
        const keys = _.keys(facetResults);
        return keys;
    })
}

exports.getById = (id)=>{
    return algoliaIndex.search(id)
    .then((content)=>{
        console.log('SEARCH RES: '+content);
        return content.hits[0];
    })
}