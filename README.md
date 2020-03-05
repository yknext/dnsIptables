# dnsIptables
DNS controlled dynamic firewall (iptables input chain)

## add config.txt
add domain,proto,listenport to config.txt like
```
www.facebook.com#tcp#80,443
www.google.com#tcp#443
```

# run dns_iptables.js
it will be generate init_iptables.sh , you must run it manual
```
iptables -N www.facebook.com
iptables -I INPUT -j www.facebook.com
iptables -N www.google.com
iptables -I INPUT -j www.google.com
```

# run it with supervisir or systemd
auto flush iptables by dns
```
cmd:
iptables -F www.google.com
iptables -I www.google.com -s 172.217.195.103 -p tcp  --dport 443 -j ACCEPT
iptables -I www.google.com -s 172.217.195.104 -p tcp  --dport 443 -j ACCEPT
iptables -I www.google.com -s 172.217.195.105 -p tcp  --dport 443 -j ACCEPT
iptables -I www.google.com -s 172.217.195.106 -p tcp  --dport 443 -j ACCEPT
iptables -I www.google.com -s 172.217.195.147 -p tcp  --dport 443 -j ACCEPT
iptables -I www.google.com -s 172.217.195.99 -p tcp  --dport 443 -j ACCEPT
cmd:
iptables -F www.facebook.com
iptables -I www.facebook.com -s 31.13.85.8 -p tcp -m multiport --dport 80,443 -j ACCEPT
```

# drop iptables input
```
iptables -P INPUT DROP
```
Be sure to add rules like SSH (22) to config.txt, or you will lose control
