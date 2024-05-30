---
author: adam
coverimage:
date: 2024-05-30T16:14:54+01:00
description: "When your homelab DNS falls over your're going to have a bad time. This is a solution that keeps the family happy."
month: "2024/05"
tags:
- homelab
- selfhost
- networking
- tech
title: "High availability DNS with Adguard Home and keepalived"
slug: "dockerised-vip-accessible-dns"
year: "2024"
---

Compared to your average home internet user I (and lets face it probably you, the reader) have a way more complicated home network than necessary;

 * I don't just have an ISP supplied router, I've got Omada network switches and routers and access points. 
 * I've got multiple small servers running network services like DNS or VPN tunnels. 

I thought I'd been a good little IT professional and had ensured that my maintenance (unplanned or otherwise) wouldn't affect my families Netflix or Paramount+ streaming by having not one but two synchronised [Adguard Home](https://adguard.com/en/adguard-home/overview.html) powered DNS servers. I'd ensured both were communicated out via DHCP (or statically configured) as the primary and secondary DNS services so that no matter what I was doing no one would be stuck without working entertainment.

But then the RaspberryPi powered device died a death, and my network fell over[^1]; because, as it turns out, not all devices do the sensible thing and what "secondary DNS server" actually means is "_try this one after_ __30 seconds of hanging about__".

<!--more-->

## What I'm doing

Here's the current portainer based docker-compose that I use for my DNS servers

```yaml
adguard:
    image: adguard/adguardhome
    hostname: "adguard.myhome.lan" # it's not this, but could be
    restart: unless-stopped
    volumes:
        - "adguard-config:/opt/adguardhome/conf"
        - "adguard-work:/opt/adguardhome/work"
    networks:
        default:
            ipv4_address: 172.20.0.3
        vlan_serv:
            ipv4_address: 10.5.0.17 #.33 on the other one
```

As you can see, I don't make it super easy on myself and therefore use [macvlan](https://docs.docker.com/network/drivers/macvlan/) based networking to have the server sit on the network in my server VLAN[^2]. I've got a almost identical stanza in another stack running on a different server to provide the two DNS services that we use.

## Fixing it

{{< toot id="112520206965010674" >}}

When I grumbled on Mastodon about the issue the general consensus appeared to be "_implementation, and therefore mileage, may vary_" and that I should probably look into something called [keepalived](https://www.keepalived.org/). A lot of the blogs I came across had all these really over architected solutions that I couldn't be bothered with so I've gone the bare minimum easy route, and it appears to work just fine.

Added to the same stacks as the Adguard instances are the additional _keepalived_ services (one for each of the Adguard services)

```yaml
keepalived:
    image: shawly/keepalived:2
    restart: unless-stopped
    environment:
        TZ: Europe/London
        KEEPALIVED_CUSTOM_CONFIG: true
    network_mode: service:adguard # this is the clever bit
    cap_add:
        - NET_ADMIN
        - NET_BROADCAST
    volumes:
        - "keepalived-config:/etc/keepalived:ro"
```

The important point to note here is that the `network_mode` has been set such that the _keepalived_ instance will live in the same network namespace as the Adguard instance they're paired with - a bit like a k8s pod or sidecar.

And in the named volumes you're going to want to add an appropriate configuration file

```bash
# primary instance
# keepalived-config/keepalived.conf
vrrp_instance VI_1 {
    state MASTER
    interface eth0 # may need to alter this
    virtual_router_id 51
    priority 200
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.5.0.10
    }
}

# secondary instance
# keepalived-config/keepalived.conf
vrrp_instance VI_1 {
    state BACKUP # this one is the backup
    interface eth0 # may need to alter this
    virtual_router_id 51
    priority 100 # notice the lower priority
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.5.0.10
    }
}
```

When you bring up your newly altered stacks you should have something similar to this in the logs for the _keepalived_ containers.

```ini
# primary instance logs
(VI_1) Entering BACKUP STATE (init)
(VI_1) received lower priority (100) advert from 10.5.0.33 - discarding
#...
(VI_1) Receive advertisement timeout
(VI_1) Entering MASTER STATE
(VI_1) setting VIPs.
(VI_1) Sending/queueing gratuitous ARPs on eth0 for 10.5.0.10
#...

# secondary instance logs
(VI_1) Entering BACKUP STATE (init)
(VI_1) Backup received priority 0 advertisement
(VI_1) Receive advertisement timeout
(VI_1) Entering MASTER STATE
(VI_1) setting VIPs.
(VI_1) Sending/queueing gratuitous ARPs on eth1 for 10.5.0.10
#...
(VI_1) Master received advert from 10.5.0.17 with higher priority 200, ours 100
(VI_1) Entering BACKUP STATE
(VI_1) removing VIPs.
```

As you can see above each of my keepalived instances has figured out what they should be doing. If I stop the master instance the backup starts advertising the VIP almost immediately.

All this means I can now point all my devices (via DHCP) to my `10.5.0.10` virtual IP and no matter what odd behaviour any given device has I've taken that particular responsibility away from it. 

## Wait, what's just happened

I've successful setup a [VRRP](https://en.wikipedia.org/wiki/Virtual_Router_Redundancy_Protocol) based virtual IP that will always, through the magic of election algorithms, point at a working DNS service. I've completely sidestepped the issue of what a device does with it's secondary DNS service by never actually needing it.

Just for funsies lets do a quick test.

```shell
$ dig @10.5.0.10 kagi.com

; <<>> DiG 9.10.6 <<>> @10.5.0.10 kagi.com
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 36658
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;kagi.com.                      IN      A

;; ANSWER SECTION:
kagi.com.               149     IN      A       34.111.242.115

;; Query time: 42 msec
;; SERVER: 10.5.0.10#53(10.5.0.10)
;; WHEN: Thu May 30 17:19:20 BST 2024
;; MSG SIZE  rcvd: 53
```

Which server did it query? I don't know. I'm not sure I care. What I do know is that I can shut down either of my two portainer hosts and the TV/iPad continues to function without me be grumbled at.

[^1]: Or, at least, the bit important to the family did.
[^2]: See [this post]({{< ref "/post/2022-04-29-samsung-tvs-and-vlans/index.md" >}}) for more information on how those can be configured.