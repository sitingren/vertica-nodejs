'use strict'
var net = require('net')
var helper = require('../test-helper')
var Connection = require('../../../lib/connection')
var utils = require('../../../lib/utils')
var connect = function (callback) {
  var username = helper.args.user
  var database = helper.args.database
  var con = new Connection({ stream: new net.Stream(), tls_mode: 'disable' })
  con.on('error', function (error) {
    console.log(error)
    throw new Error('Connection error')
  })
  con.connect(helper.args.port || '5433', helper.args.host || 'localhost')
  con.once('connect', function () {
    con.startup({
      user: username,
      database: database,
      protocol_version: (3 << 16 | 16),
    })
    con.once('authenticationCleartextPassword', function () {
      con.password(helper.args.password)
    })
    con.once('authenticationMD5Password', function (msg) {
      con.password(utils.postgresMd5PasswordHash(helper.args.user, helper.args.password, msg.salt))
    })
    con.once('authenticationSHA512Password', function (msg) {
      con.password(utils.postgresSha512PasswordHash(helper.args.password, msg.salt, msg.userSalt))
    })
    con.once('readyForQuery', function () {
      con.query('create local temp table ids(id integer)')
      con.once('readyForQuery', function () {
        con.query('insert into ids(id) values(1); insert into ids(id) values(2);')
        con.once('readyForQuery', function () {
          callback(con)
        })
      })
    })
  })
}

module.exports = {
  connect: connect,
}
