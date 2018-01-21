'use strict';
const _ = require('lodash');
const AWS = require('aws-sdk');
const eachOf = require('async/eachOf');
const algoliaHelper = require('./algolia-helper');
const kinesisClient  = new AWS.Kinesis({
  'region':'us-east-1',

})
const attachPartitionKey = record =>{
  return {
    'PartitionKey': record.course.level,
    'Data':JSON.stringify(record)

  }
}

const generateId = (record)=>{
  console.log('generating id for '+JSON.stringify(record));
  let newName = record.name.replace('/ /g','');
  let id = `W${record.address.zip}-${newName}-${record.course.level}`
  return id;
}

const prepareRecoerd = (record)=>{
  record.objectID = generateId(record);
  record.menu = {}

  if(record.course.level =='graduate'){
    record.menu['graduate'] = record.course.name;
  }else if(record.course.level =='undergraduate'){
    record.menu['undergraduate'] = record.course.name;
  }
  return record;
}


module.exports.pushToKinesis = (event, context, callback) => {
  const universityList = require('./sample-data.json');

  const records = []

  _.forEach(universityList, university =>{
    let metaInfor = _.omit(university,['courses']);

    _.forEach(university.courses, course =>{
      let record = JSON.parse(JSON.stringify(metaInfor))
      record.course = course;
      records.push(prepareRecoerd(record));
    });

  });

  console.log('!!!>>>'+records);

  const recordsToTransmit = _.map(records, attachPartitionKey);

  const params = {
    Records: recordsToTransmit,
    StreamName: 'uni-project-stream'
  };


  kinesisClient.putRecords(params, (err,data)=>{
    if(err){
      console.log(err,err.stack);
    }else{
      console.log(data);
      callback(null,data);
    }
  })
  
};


module.exports.pushToAlgolia = (event, context, callback) => {
  console.log(event);
  const list = event.Records;

  const iterate = (record, key,cb)=>{
    let retrievedRecord = new Buffer(record.kinesis.data,'base64').toString();
    let universityInfo = JSON.parse(retrievedRecord);

    console.log('PARSED REC: '+universityInfo.name+'  '+universityInfo.course.name);

    algoliaHelper.addToAlgolia(universityInfo)
    .then(()=>{
      console.log('done writing to algolia');
      cb();
    })
    .catch((err)=>{
      console.log('error rwriting to algolia');
      cb(err);
    })
  }

  eachOf(list, iterate, function(err){
    if(err)
      callback(err);
    callback(null, 'No of records pushed: '+list.length);
  });
}

//menu?category=undergraduate
module.exports.getMenu = (event, context, callback) => {
  console.log(event);
  const category = event.queryStringParameters.category;

  if(!category){
    const errorResponse = {
      statusCode: 200,
      body: 'pls specify a category!'
    };
    callback(null, errorResponse);
  }else{

    algoliaHelper.getMenu(category)
    .then(menuResults =>{
      const response = {
        statusCode: 200,
        body: JSON.stringify(menuResults)
      };
      callback(null, response);s
    }) 

    
  }
}