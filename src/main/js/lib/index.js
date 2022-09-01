/**
 * @todo
 * - Must include origin data in syslog structure-data within source-metadata
 * - Must include hostname within new syslog structured-data (SD) so utilization systems can utilize it
 * Appender jsa_01 to push log messages over relp to a compatible relp-server with syslog envelope
 * 
 */

 'use strict'

 const { SyslogMessage, Facility, SDElement, SDParam, Severity } = require('@teragrep/rlo_08')
 const { RelpConnection, RelpBatch } = require('@teragrep/rlp_02')
 const os = require('os')
 const debug = require('debug')//('log4js:jsa_01');
 
 let relpConnection;

 /**
  * 
  *  +----------+         +-----+         +---------+
  *  |Originator|---->----|Relay|---->----|Collector|
  *  +----------+         +-----+         +---------+
  * @param {} config 
  * @param {} layout 
  * @param {} levels 
  * 
  */

 function jsAppender(config, layout, levels) {
  const levelMapping = {};
  levelMapping[levels.ALL] = Severity.DEBUG
  levelMapping[levels.TRACE] = Severity.DEBUG
  levelMapping[levels.DEBUG] = Severity.DEBUG
  levelMapping[levels.INFO] = Severity.INFORMATIONAL
  levelMapping[levels.WARN] = Severity.WARNING
  levelMapping[levels.ERROR] = Severity.ERROR
  levelMapping[levels.FATAL] = Severity.CRITICAL

  const appName = config.appName || 'teragrep-blacksquad'
  const hostname = config.hostname || os.hostname()
  const serverPort = config.serverPort || 1601
  const serverAddress = config.serverAddress || '127.0.0.1'
  debug('Appender create with config ', config);

  const con = {
    protocol: 'relp',
    serverAddress:serverAddress,
    serverPort: serverPort,
    hostname: hostname,
    appName: appName,
   // jsa_type: type
}


function setupConnection(serverPort, serverAddress){
  return new Promise(async (resolve, reject) => {
    relpConnection = new RelpConnection();
    let conn = await relpConnection.connect(serverPort, serverAddress);	
    console.log('Connectig...',serverAddress,' at PORT ', serverPort, conn)
    resolve(true)
  })
}

async function init(){
    let host = serverAddress //'localhost';
    let port = serverPort//1601;
     return await setupConnection(port, host);
  }
  //init()

  // Generate & wrap the messages in the syslog envelop 
async function generateSyslogMessage(loggingEvent){
 console.log('DATA',loggingEvent.startTime, loggingEvent.categoryName, loggingEvent.data, loggingEvent.level, loggingEvent.context, loggingEvent.pid)
  //let originSDElement = new SDElement('origin', hostname)

  let startTime = loggingEvent.startTime
  let categoryName = loggingEvent.categoryName
  let context = loggingEvent.context
  let pid = loggingEvent.pid.toString() // Converting to string for adjusting to syslog
  let level = loggingEvent.level.levelStr

  console.log(loggingEvent.level.levelStr, loggingEvent.data)


  let message = new SyslogMessage.Builder()
       .withAppName(appName) //validation
       .withTimestamp(startTime) // 
       .withHostname(hostname)   
       .withFacility(Facility.LOCAL0)
       .withSeverity(Severity.CRITICAL) // 
       .withProcId(pid) 
       .withMsgId('ID47')
       .withMsg('Solve the problem. Then, write the code') // @todo: extract the message from the log
       .withSDElement(new SDElement("exampleSDID@32473", new SDParam("iut", "3"), new SDParam("eventSource", "Application")))  
       .withDebug(true) // Note this line set enable all the console log messages🤓
       .build()

      return await message.toRfc5424SyslogMessage();
       //return rfc5424message;
}



const app = async (loggingEvent) => {
    
   
    // Generate the syslog message
   let rfc5424log = await generateSyslogMessage(loggingEvent)

    // Lets create the RELP connection
    await init()
    await commit(rfc5424log)
    process.stdout.write(`${rfc5424log}\n`); // printing on the console in case conolse disabled

  };

  return app
}

async function commit(msg){
    return new Promise(async(resolve, reject) => {
      let relpBatch = new RelpBatch();
      relpBatch.insert(msg);
      
      let resWindow = await relpConnection.commit(relpBatch);
      
      let notSent = (resWindow === true) ? true : false; //Test purpose 
      while(notSent){                          
        let res = await relpBatch.verifyTransactionAllPromise();                              
        if(res){
            notSent = false;
            resolve(true);
            }
        else{
          reject(false);
            }                            
      }    
     return resolve(true);
    }) 
  }

function configure(config, layouts, levels) {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return jsAppender(config, layout, levels);
}

exports.configure = configure;
