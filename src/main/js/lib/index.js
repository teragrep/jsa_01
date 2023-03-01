/**
 * @todo
 * - Must include origin data in syslog structure-data within source-metadata
 * - Must include hostname within new syslog structured-data (SD) so utilization systems can utilize it
 * Appender jsa_01 to push log messages over relp to a compatible relp-server with syslog envelope
 * 
 * 
 */
// jsa_01 test for config hostname possible override  
//feat: configure the entreprise ID support
 'use strict'

 const { SyslogMessage, Facility, SDElement, SDParam, Severity } = require('@teragrep/rlo_08')
 const { RelpConnection, RelpBatch } = require('@teragrep/rlp_02')
 const os = require('os')
 const debug = require('debug')//('log4js:jsa_01');
 const async = require('async')
 const { Console } = require('console')
 const crypto = require('crypto') // handling the UUID generation
 
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

 const jsAppender = (config, layout, levels) => {
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
  const useSD = config.useSD || Boolean(false)
  debug('Appender create with config ', config);

  const con = {
    protocol: 'relp',
    serverAddress:serverAddress,
    serverPort: serverPort,
    hostname: hostname,
    appName: appName,
    useSD : useSD
   // jsa_type: type
}

/**
 * TODO: Handling the server connection timeout 
 * @param {Number} serverPort 
 * @param {string} serverAddress 
 * @returns 
 */
async function setupConnection(serverPort, serverAddress){
  return await new Promise(async (resolve, reject) => {
    relpConnection = new RelpConnection();
    let conn = await relpConnection.connect(serverPort, serverAddress);	
    console.log('Connectig...',serverAddress,' at PORT ', serverPort, conn)
    resolve(conn)
  })
}

async function start(){
    let host = serverAddress //'localhost';
    let port = serverPort//1601;
    return await setupConnection(port, host);
  }

  // Generate & wrap the messages in the syslog envelop 
async function generateSyslogMessage(loggingEvent){

  return await new Promise(async(resolve, reject) => {
    let startTime = loggingEvent.startTime
    let pid = loggingEvent.pid.toString() // Converting to string for adjusting to syslog
 // let level = loggingEvent.level.levelStr // Current implememation uses the hardcoded level
    let logData = (loggingEvent.data[0] != '' ? loggingEvent.data[0] : '-')
  //Add SD if enabled
    let event_id_48577, origin_48577;
    if(useSD){
      event_id_48577 = await new SDElement("event_id@48577")
      event_id_48577.addSDParam("hostname",hostname)
      event_id_48577.addSDParam("uuid",crypto.randomUUID().toString())    
      event_id_48577.addSDParam("source", "source")
      event_id_48577.addSDParam("unixtime",Math.floor(Date.now() / 1000).toString())  

      origin_48577 = new SDElement("origin@48577")
    }


    let message = new SyslogMessage.Builder()
       .withAppName(appName) //validation
       .withTimestamp(startTime) // 
       .withHostname(hostname)   
       .withFacility(Facility.USER) // user-defined 
       .withSeverity(Severity.WARNING) // Warining 
       .withProcId(pid) 
       .withMsg(logData) // 

       .withSDElement(event_id_48577) 
       .withSDElement(origin_48577) 
       //.withSDElement(new SDElement("exampleSDID@32473", new SDParam("iut", "3"), new SDParam("eventSource", "HyväApplication")))  
       .withDebug(false) // Note this line set enable all the console log messages🤓
       .build()
       return resolve (await message.toRfc5424SyslogMessage());
       //return rfc5424message;
    })
  }
// Current automation print the syslog message before relp commit method.

const app = async (loggingEvent) => {

  beforeEach(async function (){ // This is one of the way Jasmine support for  managing async works promises, otherwise it assumes as synchronus & move on

    // Generate the syslog message
    let rfc5424log = await generateSyslogMessage(loggingEvent)


    // Lets create the RELP connection
    let conn = await start();
     
  
    function print(arg){
      console = new Console({stdout: process.stdout, stderr: process.stderr});
      console.log(arg)
    }

  
      if(conn){
     //process.platform === 'linux' ? console.info(`${rfc5424log}\n`) : '' // Testing for the workflow
     let result= await commit(rfc5424log)
     if(result){  
        await print(`${rfc5424log}`) // Workflow OS ubuntu does not print the console message, so try to solve it adjusting the Console obj🤠 
        console.log = () => { }; // Again disable the console
      }
      
      await disconnect()
    }

  })
  
  };

    app.shutdown =  async(cb) => { 
      await disconnect()
      await cb()
  }
  return app
}

async function commit(msg){
    return new Promise(async(resolve, reject) => {
      let relpBatch = new RelpBatch();
      await relpBatch.insert(msg);
      
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

const configure = (config, layouts, levels) => {
  let layout = layouts.basicLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return jsAppender(config, layout, levels);
}

//exports.configure = configure;
/*
module.exports = {
  configure,
  jsAppender
}*/
exports = module.exports = jsAppender
exports.configure = configure