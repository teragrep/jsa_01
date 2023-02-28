
const log4js = require('log4js')
var jsAppender = require('../../main/js/lib/index.js')


log4js.configure( {
    appenders: {jsa: { type: jsAppender, appName: 'teragrep', hostname: 'relp.teragrep.com', useSD: true },
    console: { type: 'console' },
  },
  categories: {
    jsa: { appenders: ['jsa'], level: 'error' },
    default: { appenders: ['jsa'], level: 'trace' },
  },
})

const logger = log4js.getLogger('jsa');
logger.fatal("Don't  test it as a NASA application😎"); 
 