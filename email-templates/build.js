#!/usr/bin/env node

'use strict'

const Promise = require('bluebird')
const juice = require('juice')
const path = require('path')
const fs = Promise.promisifyAll(require('fs'))

const inPath = path.join(__dirname, 'welcome-email.html')
const outPath = path.join(__dirname, 'welcome-email-inlined.html')

juice.juiceFile(inPath, {}, async (err, html) => {
  fs.writeFileAsync(outPath, html, 'utf-8')
})
