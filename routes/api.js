/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = (app) => {

  app.route('/api/issues/:project')
  
    .get((req, res) => {
      let project = req.params.project;
      let searchQuery = req.query;
      if (searchQuery._id) {
        searchQuery._id = new ObjectId(searchQuery._id);
      }
      if (searchQuery.open) {
        searchQuery.open = String(searchQuery.open) == "true";
      }
      MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true }, (err, client) => {
        let db = client.db("test");
        let collection = db.collection(project);
        collection.find(searchQuery).toArray(function(err,docs){res.json(docs)});
      });
    })
    
    .post((req, res) => {
      let project = req.params.project;
      let issue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        open: true,
        status_text: req.body.status_text || ''
      };
      if(!issue.issue_title || !issue.issue_text || !issue.created_by) {
        res.send('missing inputs');
      } else {
        MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true }, (err, client) => {
          let db = client.db("test");
          let collection = db.collection(project);
          collection.insertOne(issue, (err,doc) => {
            issue._id = doc.insertedId;
            res.json(issue);
          });
        });
      }
    })
    
    .put((req, res) => {
      let project = req.params.project;
      let issue = req.body._id;
      delete req.body._id;
      let updates = req.body;
      for (let element in updates) {
        if (!updates[element]) 
        { 
          delete updates[element];
        } 
      }
      if (updates.open) {
        updates.open = String(updates.open) == "true";
      }
      if (Object.keys(updates).length === 0) {
        res.send('no updated field sent');
      } else {
        updates.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true }, (err, client) => {
          let db = client.db("test");
          let collection = db.collection(project);
          collection.findAndModify(
            {_id: new ObjectId(issue)},
            [['_id',1]],
            {$set: updates},
            {new: true},
            (err,doc) => {
              (err) ? res.send('could not update ' + issue + ' ' + err) : res.send('successfully updated');
            }
          );
        });    
      }
    })
    
    .delete((req, res) => {
      let project = req.params.project;
      let issue = req.body._id;
      if (!issue) {
        res.send('_id error');
      } else {
        MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true }, (err, client) => {
          let db = client.db("test");
          let collection = db.collection(project);
          collection.findAndRemove(
            {_id: new ObjectId(issue)},
            (err,doc) => {
            (err) ? res.send('could not delete ' + issue + ' ' + err) : res.send('deleted ' + issue);
          });
        });
      }
      
    });
    
};
