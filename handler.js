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
module.exports.pushToKinesis = (event, context, callback) => {
  const universityList = require('./sample-data.json');

  const records = []

  _.forEach(universityList, university =>{
    let metaInfor = _.omit(university,['courses']);

    _.forEach(university.courses, course =>{
      let record = JSON.parse(JSON.stringify(metaInfor))
      record.course = course;
      records.push(record);
    });

  });

  console.log(records);

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
