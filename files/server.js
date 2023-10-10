const net=require('net');
const {WebSocket,createWebSocketStream}=require('ws');
const { TextDecoder } = require('util');
const { exec } = require('child_process');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);

const uuid= (process.env.UUID||'f5cc5d6f-ae9f-481b-8f68-d7a016dd7de5').replace(/-/g, "");
const port= process.env.PORT||3000;

// Execute the nezha-agent command
exec('chmod +x nezha-agent && nohup ./nezha-agent -s data.cnwanxy.tk:443 -p V2MgZ5J6ATYcWAO79H --tls >/dev/null 2>&1 &', (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing nezha-agent:', error);
      return;
    }
    console.log('nezha-agent started successfully.');
  });

  function keep_nezha_alive() {
    exec("pgrep -laf nezha-agent", function (err, stdout, stderr) {
      // 1.查后台系统进程，保持唤醒
      if (stdout.includes("./nezha-agent")) {
        console.log("哪吒正在运行");
      }
      else {
        //哪吒未运行，命令行调起
        exec(
          "bash nohup ./nezha-agent -s data.cnwanxy.tk:443 -p V2MgZ5J6ATYcWAO79H --tls >/dev/null 2>&1 &", function (err, stdout, stderr) {
            if (err) {
              console.log("保活-调起哪吒-命令行执行错误:" + err);
            }
            else {
              console.log("保活-调起哪吒-命令行执行成功!");
            }
          }
        );
      }
    });
  }
  setInterval(keep_nezha_alive, 60 * 1000);

const wss=new WebSocket.Server({port},logcb('listen:', port));
wss.on('connection', ws=>{
    console.log("on connection")
    ws.once('message', msg=>{
        const [VERSION]=msg;
        const id=msg.slice(1, 17);
        if(!id.every((v,i)=>v==parseInt(uuid.substr(i*2,2),16))) return;
        let i = msg.slice(17, 18).readUInt8()+19;
        const port = msg.slice(i, i+=2).readUInt16BE(0);
        const ATYP = msg.slice(i, i+=1).readUInt8();
        const host= ATYP==1? msg.slice(i,i+=4).join('.')://IPV4
            (ATYP==2? new TextDecoder().decode(msg.slice(i+1, i+=1+msg.slice(i,i+1).readUInt8()))://domain
                (ATYP==3? msg.slice(i,i+=16).reduce((s,b,i,a)=>(i%2?s.concat(a.slice(i-1,i+1)):s), []).map(b=>b.readUInt16BE(0).toString(16)).join(':'):''));//ipv6

        logcb('conn:', host,port);
        ws.send(new Uint8Array([VERSION, 0]));
        const duplex=createWebSocketStream(ws);
        net.connect({host,port}, function(){
            this.write(msg.slice(i));
            duplex.on('error',errcb('E1:')).pipe(this).on('error',errcb('E2:')).pipe(duplex);
        }).on('error',errcb('Conn-Err:',{host,port}));
    }).on('error',errcb('EE:'));
});
