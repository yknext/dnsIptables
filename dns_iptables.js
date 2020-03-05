//os
var os = require('os');
//dynamic-iptables
const DynIptables = require('dynamic-iptables')
//fs
const fs = require("fs");

//process
var process = require('child_process');

//lastIp
var lastIpDic = {};

function arrCompare(arr1, arr2){
    arr1 = arr1.sort()
    arr2 = arr2.sort()
    if (arr1.length == arr2.length
        && arr1.every(function(u, i) {
            return u === arr2[i];
        })
    ) {
       return true;
    } else {
       return false;
    }
}

function updateIptables(domain,proto,dport){

    const options = {
        domain: domain,
        chain: domain,
        proto: proto,
        dport: dport,
        target: 'ACCEPT',
        multiport: dport.indexOf(',')>0
    }

    DynIptables.resolveDnsName(options.domain, (err, res) => {
        if (err) {
            return console.log(err)
        }
        //check change
        var lastIpArr = lastIpDic[options.domain] == null ? [] : lastIpDic[options.domain];
        if(res && res.length>0 && !arrCompare(lastIpArr,res)){
            updateRule(options, res);
        }
        lastIpDic[options.domain] = res;
        
      });
}

function updateRule(options,domainArr){
    var rules = [];
    rules.push('iptables -F '+ options['chain'])
    domainArr.map((address) => {
        let multiport = (options.multiport === true || options.multiport === 'true') ? `-m multiport` : ''
        let proto     = (options.proto == null) ? "" : "-p " + options.proto
        rules.push(`iptables -I ${options['chain']} -s ${address} ${proto} ${multiport} --dport ${options['dport']} -j ${options['target']}`)
    })

    var cmd = rules.join('\n');
    console.log('cmd:\n'+cmd);
    var type=os.type();
    //mac debug
    if(type != 'Darwin'){
        process.exec(cmd, function(error, stdout, stderr) {
            console.log("error:"+error);
            console.log("stdout:"+stdout);
            console.log("stderr:"+stderr);
        });
    }
}

function generateInitScript(domainList){
    var initRule = [];
    for(domain of domainList){
        //new
        initRule.push('iptables -N ' + domain)
        //insert
        initRule.push('iptables -I INPUT -j ' + domain)
    }
    console.log('init cmd: \n' + initRule.join('\n'));
    fs.writeFile(__dirname + '/init_iptables.sh', initRule.join('\n'), {}, function(err) {
        if (err) {
            throw err;
        }
    });
}

//eg: 
//www.google.com#tcp#80,443
//www.example.com#tcp#80
function main(){
    fs.readFile(__dirname+"/config.txt", "utf-8", function(err, data) {
        if (err) return console.log("read condig.txt fail " + err.message);
        let config = data.toString();
        var domainList = [];
        var configList = [];
        for(var line of config.split('\n')){
            var lineSplit = line.split('#');
            if(lineSplit.length == 3){
                var d = {};
                d.domain = lineSplit[0];
                d.proto  = lineSplit[1];
                d.dport  = lineSplit[2];
                configList.push(d);
                domainList.push(d.domain);
            }
        }
        //init
        generateInitScript(domainList);

        for(var d of configList){
            try{
                updateIptables(d.domain,d.proto,d.dport);
            }catch(e){
                console.log('update fail ', e);
            }
        }
      });
}

main()
// loop
setInterval(function(){
    main();
},60 * 1000);
