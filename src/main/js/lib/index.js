/**
 * 
 * 
 */

'use strict'

const { SyslogMessage, Facility, SDElement, SDParam, Severity } = require('@teragrep/rlo_08')
const { RelpConnection, RelpBatch } = require('@teragrep/rlp_02')
const os = require('os')
const debug = require('debug')('log4js:jsa_01');


let relpConnection;
let serverAddress;
let serverPort;

/**
 * 
 *  +----------+         +-----+         +---------+
    |Originator|---->----|Relay|---->----|Collector|
    +----------+         +-----+         +---------+
 * @param {} config 
 * @param {} layout 
 * @param {} levels 
 * 
 * @todo
 *  - Must include origin data in syslog structure-data within source-metadata
 *  - Must include hostname within new syslog structured-data (SD) so utilization systems can utilize it
 */
function jsAppender(config, layout, levels){
   

    const levelMapping = {};
    levelMapping[levels.ALL] = Severity.DEBUG
    levelMapping[levels.TRACE] = Severity.DEBUG
    levelMapping[levels.DEBUG] = Severity.DEBUG
    levelMapping[levels.INFO] = Severity.INFORMATIONAL
    levelMapping[levels.WARN] = Severity.WARNING
    levelMapping[levels.ERROR] = Severity.ERROR
    levelMapping[levels.FATAL] = Severity.CRITICAL

    const appName = config.appName
    const hostname = config.hostname || os.hostname
    serverPort = config.serverPort
    serverAddress = config.serverAddress

    //Must include origin data in syslog structure-data within source-metadata
    let originSDElement = new SDElement('origin', hostname)
    
    //Must include hostname within new syslog structured-data (SD) so utilization systems can utilize it


    // Generate the Sylog message 
    let message = new SyslogMessage.Builder()
                .withAppName(appName)
                .withHostname(hostname)
               
    
    

    // Setting the relpConnection

    const conn = (serverPort, serverAddress) => {
        return new Promise(async (resolve, reject) => {
          relpConnection = new RelpConnection();
          await relpConnection.connect(serverPort, serverAddress);	
          debug(`Connectig...: ${serverAddress} at at PORT: ${serverPort}` )
          resolve(relpConnection)
        }
    )};
}

/**
 * 
 * @param {*} config 
 * @param {*} layouts 
 * @param {*} levels 
 * @returns 
 */
function configure(config, layouts, levels) {
    let layout = layouts.pattern 
    if(config.layout) {
        layout = layouts.layout(config.layout.tyoe, config.layout)
    }
    return jsAppender(config, layout, levels)
}
module.exports.configure = configure;


