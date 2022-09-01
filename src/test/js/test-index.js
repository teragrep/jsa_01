const log4js = require('log4js')
var jsAppender = require('../../main/js/lib/index.js')

const appenderJSModule = {
    configure: (config, layouts, findAppender, level) => {

    }
}


log4js.configure( {
    appenders: {jsa: { type: jsAppender, },
    console: { type: 'console' },
  },
  categories: {
    jsa: { appenders: ['jsa'], level: 'error' },
    another: { appenders: ['console'], level: 'trace' },
    default: { appenders: ['jsa'], level: 'trace' },
  },
})

const logger = log4js.getLogger('jsa');
/*  
// only errors and above get logged.
  const otherLogger = log4js.getLogger();
  
  // this will get coloured output on console, and appear in log
  otherLogger.error('AAArgh No Worries! Something went wrong 😎', {
    some: 'otherObject',
    useful_for: 'debug purposes',
  });
  otherLogger.log('This should appear as info output');
  */

  // these will not appear (logging level beneath error)
  logger.trace('Entering trace: First, solve the problem. Then, write the code');
  logger.debug('Got TG.');
  
  logger.log('Something funny about DEBUG.');
  logger.warn('BUG is quite smelly.');
  // these end up 
  logger.error('FIX %s is over enginnered 😎!', 'Cheera!');
  //logger.fatal('Cheese was breeding ground for listeria.');
 // logger.fatal('Don’t test it as a NASA application');
 
  /*
  // these don't end up in cheese.log, but will appear on the console
  const anotherLogger = log4js.getLogger('another');
  anotherLogger.debug('Just checking');
  
  // will also go to console and cheese.log, since that's configured for all categories
  const bulkLog = log4js.getLogger('bulk-tg');
  bulkLog.debug('Something for bigdata ');
  */