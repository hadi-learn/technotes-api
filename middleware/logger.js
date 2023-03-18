const { format } = require('date-fns')
const { v4: uuidV4 } = require('uuid')
const path = require('path')
const fs = require('fs')
const fsPromises = require('fs').promises

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss')
  const logItem = `${dateTime}\t${uuidV4()}\t${message}\n`

  try {
    if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
      await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
    }
    await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem)
  } catch (err) {
    console.log(err)
  }
}

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
  console.log(`${req.method}\t${req.path}`)
  next()
}

module.exports = { logEvents, logger }