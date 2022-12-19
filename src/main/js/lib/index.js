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
 const async = require('async')
 
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
   /**
    * this is for upcoming setting  
    */
   /*
  const levelMapping = {};
  levelMapping[levels.ALL] = Severity.DEBUG
  levelMapping[levels.TRACE] = Severity.DEBUG
  levelMapping[levels.DEBUG] = Severity.DEBUG
  levelMapping[levels.INFO] = Severity.INFORMATIONAL
  levelMapping[levels.WARN] = Severity.WARNING
  levelMapping[levels.ERROR] = Severity.ERROR
  levelMapping[levels.FATAL] = Severity.CRITICAL 
*/
  const appName = config.appName || '-' // leave it empty
  const hostname = config.hostname || os.hostname()
  const serverPort = config.serverPort || 1601
  const serverAddress = config.serverAddress || 'localhost'
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

async function start(){
    let host = serverAddress //'localhost';
    let port = serverPort//1601;
    return await setupConnection(port, host);
  }
 // init()

  // Generate & wrap the messages in the syslog envelop 
async function generateSyslogMessage(loggingEvent){

  return await new Promise(async(resolve, reject) => {
    let startTime = loggingEvent.startTime
    let pid = loggingEvent.pid.toString() // Converting to string for adjusting to syslog
 // let level = loggingEvent.level.levelStr // Current implememation uses the hardcoded level
    let logData = (loggingEvent.data[0] != '' ? loggingEvent.data[0] : '-')

    let message = new SyslogMessage.Builder()
       .withAppName(appName) //validation
       .withTimestamp(startTime) // 
       .withHostname(hostname)   
       .withFacility(Facility.USER) // user-defined 
       .withSeverity(Severity.WARNING) // Warining 
       .withProcId(pid) 
       .withMsg(logData) // 
       .withSDElement(new SDElement("exampleSDID@32473", new SDParam("iut", "3"), new SDParam("eventSource", "HyväApplication")))  
       .withDebug(false) // Note this line set enable all the console log messages🤓
       .build()
       return resolve (await message.toRfc5424SyslogMessage());
       //return rfc5424message;
    })
  }
// Maven setup + node // NPM update ** 
const app = async (loggingEvent) => {
    
  // Generate the syslog message
   let rfc5424log = await generateSyslogMessage(loggingEvent)

   // Lets create the RELP connection
  
    let conn = await start();
    
    if(conn){
      process.stdout.write(`${rfc5424log}\n`)
      let result= await commit(rfc5424log)
      if(result){
        process.stdout.write(`${rfc5424log}\n`); // printing on the console in case conolse disabled
        process.stdout.write('Success')
      }
      //await disconnect()
    }
  };

    app.shutdown =  async(cb) => { 
      await disconnect()
      await cb()
  }
  return app
}
/**
 * This method for testing purpose***
 * @param {*} ms 
 * @returns 
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function commit(msg){
    return new Promise(async(resolve, reject) => {
      let relpBatch = new RelpBatch();
      relpBatch.insert(msg);
      
      let resWindow = await relpConnection.commit(relpBatch);
      await disconnect(resWindow)
      
      let notSent = (resWindow === true) ? true : false; 
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

  async function disconnect(state) {
    if(state){
       await relpConnection.disconnect();
    }
    else {
      console.log('Check the connection...')
    }
    
  }

function configure(config, layouts, levels) {
  let layout = layouts.basicLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return jsAppender(config, layout, levels);
}

exports.configure = configure;
