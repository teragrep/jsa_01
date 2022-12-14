
const log4js = require('log4js')
var jsAppender = require('../../main/js/lib/index.js')


log4js.configure( {
    appenders: {jsa: { type: jsAppender, appName: 'teragrep' },
    console: { type: 'console' },
  },
  categories: {
    jsa: { appenders: ['jsa'], level: 'error' },
    another: { appenders: ['console'], level: 'trace' },
    default: { appenders: ['jsa'], level: 'trace' },
  },
})

const logger = log4js.getLogger('jsa');

  // these will not appear (logging level beneath error)
  logger.trace('Entering trace: First, solve the problem. Then, write the code');
  logger.debug('Got TG.');
  logger.trace('Entering trace: First, solve the problem. Then, write the code');
  
  logger.log('Something funny about DEBUG.');
  logger.warn('BUG is quite smelly.');
  // these end up 
  //logger.error('FIX %s is over enginnered 😎!', 'Cheers!');
  //logger.error('Entering trace: First, solve the problem. Then, write the code');
  //logger.fatal('Don’t test it as a NASA application');  // ⛔ The Unicode character ' (U+2019 RIGHT SINGLE QUOTATION MARK) . So when pushing the log message with U+2019 fails but WHY???
  logger.fatal("Don't  test it as a NASA application"); 
 