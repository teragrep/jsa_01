/**
 * 
 * 
 */

 'use strict'

 const { SyslogMessage, Facility, SDElement, SDParam, Severity } = require('@teragrep/rlo_08')
 const { RelpConnection, RelpBatch } = require('@teragrep/rlp_02')
 const os = require('os')
 const debug = require('debug')//('log4js:jsa_01');
 
 
 let relpConnection;
 //let serverAddress;
 //let serverPort;
 



 /**
  * 
  *  +----------+         +-----+         +---------+
  *  |Originator|---->----|Relay|---->----|Collector|
  *  +----------+         +-----+         +---------+
  * @param {} config 
  * @param {} layout 
  * @param {} levels 
  * 
  * @todo
  *  - Must include origin data in syslog structure-data within source-metadata
  *  - Must include hostname within new syslog structured-data (SD) so utilization systems can utilize it
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
  const hostname = config.hostname || os.hostname
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


async function generateSyslogMessage(loggingEvent){
 // console.log('DATA', loggingEvent.data, loggingEvent.level)
  let originSDElement = new SDElement('origin', hostname)

  let message = new SyslogMessage.Builder()
       .withAppName('bulk-data-sorted') //valid
    // .withTimestamp(timestamp) // In case if the timestamp disabled, it will go with system timestamp.
       .withHostname(hostname) //valid  
       .withFacility(Facility.LOCAL0)
       .withSeverity(Severity.CRITICAL) // 
       .withProcId('8740') 
       .withMsgId('ID47')
       .withMsg('solve the problem. Then, write the code') // @todo: extract the message from the log
       .withSDElement(new SDElement("exampleSDID@32473", new SDParam("iut", "3"), new SDParam("eventSource", "Application")))  
       .withDebug(false)
       .build()

      return await message.toRfc5424SyslogMessage();
       //return rfc5424message;
}

const app = (loggingEvent) => {

    // Generate the syslog message
   let rfc5424log =  generateSyslogMessage(loggingEvent)
   console.log('RFC IS MISSING::::',rfc5424log)

    // Lets create the RELP connection
    setupConnection(serverPort, serverAddress)
    process.stdout.write(`${rfc5424log}\n`);
    process.stdout.write(`${layout(loggingEvent)}\n`);
  };

  return app
}

function configure(config, layouts, levels) {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return jsAppender(config, layout, levels);
}

exports.configure = configure;
