import Application from "../application";
import { I_clientManager, I_clientSocket, SocketProxy, I_connectorConfig, loggerLevel } from "../util/interfaceDefine";
import * as define from "../util/define";
import { Session } from "../components/session";
import { EventEmitter } from "events";
import * as ws from "ws";
import * as https from "https";
import * as http from "http";
import { some_config } from "../util/define";
import * as crypto from "crypto";

let maxLen = 0;
/**
 * connector  http
 */
export class ConnectorHttp {
    public app: Application;
    public clientManager: I_clientManager = null as any;
    // public handshakeBuf: Buffer;        // Handshake buffer
    // public handshakeBufAll: Buffer = null as any;        // Handshake buffer all
    // public heartbeatBuf: Buffer;        // Heartbeat response buffer
    // public heartbeatTime: number = 0;   // Heartbeat time
    // private maxConnectionNum: number = Number.POSITIVE_INFINITY;
    // public nowConnectionNum: number = 0;
    public sendCache = false;
    public interval: number = 0;
    public md5 = "";    // route array md5

    constructor(info: { app: Application, clientManager: I_clientManager, config: I_connectorConfig, startCb: () => void }) {
        this.app = info.app;
        this.clientManager = info.clientManager;

        let connectorConfig = info.config || {};
        maxLen = connectorConfig.maxLen || define.some_config.SocketBufferMaxLen;
        // this.heartbeatTime = (connectorConfig.heartbeat || 0) * 1000;
        // if (connectorConfig.maxConnectionNum != null) {
        //     this.maxConnectionNum = connectorConfig.maxConnectionNum;
        // }
        let interval = Number(connectorConfig.interval) || 0;
        if (interval >= 10) {
            this.sendCache = true;
            this.interval = interval;
        }

        httpServer(info.app.serverInfo.clientPort, connectorConfig, info.startCb, this.newRequest.bind(this));
        let session = new Session(this.app.serverId);
        
        // // Handshake buffer
        // let cipher = crypto.createHash("md5")
        // this.md5 = cipher.update(JSON.stringify(this.app.routeConfig)).digest("hex");

        // let routeBuf = Buffer.from(JSON.stringify({ "md5": this.md5, "heartbeat": this.heartbeatTime / 1000 }));
        // this.handshakeBuf = Buffer.alloc(routeBuf.length + 5);
        // this.handshakeBuf.writeUInt32BE(routeBuf.length + 1, 0);
        // this.handshakeBuf.writeUInt8(define.Server_To_Client.handshake, 4);
        // routeBuf.copy(this.handshakeBuf, 5);

        // let routeBufAll = Buffer.from(JSON.stringify({ "md5": this.md5, "route": this.app.routeConfig, "heartbeat": this.heartbeatTime / 1000 }));
        // this.handshakeBufAll = Buffer.alloc(routeBufAll.length + 5);
        // this.handshakeBufAll.writeUInt32BE(routeBufAll.length + 1, 0);
        // this.handshakeBufAll.writeUInt8(define.Server_To_Client.handshake, 4);
        // routeBufAll.copy(this.handshakeBufAll, 5);

        // // Heartbeat response buffer
        // this.heartbeatBuf = Buffer.alloc(5);
        // this.heartbeatBuf.writeUInt32BE(1, 0);
        // this.heartbeatBuf.writeUInt8(define.Server_To_Client.heartbeatResponse, 4);
    }

    private newRequest(req:http.IncomingMessage, res:http.ServerResponse) {
        let self = this;
        let msg="";
        req.on('data',function(chunk){
            msg+=chunk;
        });
        req.on('end',function(){
            if(msg!=null){
                self.clientManager.handleHttp(msg, function(msgBuf:Buffer){
                    res.writeHead(200);
                    res.end(msgBuf);
                });              
            }
        });        
    }
}


/**
 * websocket server
 */
function httpServer(port: number, config: I_connectorConfig, startCb: () => void, newRequest: (req:http.IncomingMessage, res:http.ServerResponse) => void) {
    let httpServer = config["ssl"] ? https.createServer({ "cert": config["cert"], "key": config["key"] }, (req, res) => {
        newRequest(req, res);
    }) : http.createServer((req, res) => {
        newRequest(req, res);
    });

    httpServer.listen(port, startCb);
}

// class HttpSocket extends EventEmitter implements SocketProxy {
//     die: boolean = false;
//     remoteAddress: string = "";
//     socket: http.ServerResponse;
//     maxLen: number = 0;
//     len: number = 0;
//     buffer: Buffer = null as any;
//     headLen = 0;
//     headBuf = Buffer.alloc(4);
//     constructor(req:http.IncomingMessage, socket: http.ServerResponse, remoteAddress: string) {
//         super();
//         this.socket = socket; 
//         this.remoteAddress = remoteAddress;
//         this.emit("data", "");
//     }


//     close() {
//         // this.socket.close();
//         // this.socket.emit("close");
//     }
// }