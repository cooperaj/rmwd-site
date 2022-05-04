---
author: adam
coverimage: cover
date: 2022-04-29T15:34:35+01:00
description:
month: "2022/04"
tags: 
- homelab
- omada
- vlans
- iot
- traefik
- tech
title: "VLANs and Samsung TV's"
slug: vlans-and-samsung-tvs
year: "2022"
---

{{<callout>}}
##### TLDR

Samsung Smart TVs running Tizen OS [like mine](https://www.samsung.com/uk/support/model/QE49Q60RATXXU/) deny connections to their control websocket from source IP addresses that are not on the TV's subnet. This, in theory, is a pretty straight forward security feature. Except you can't turn it off and when you're using VLANs the TV becomes impossible to control remotely. 

Read on, or [go straight to the solution](#a-solution)
{{</callout>}}

## Background

<!--start-summary-->

If you're anything like me you'll have a bunch of IoT smart home devices; if you're anywhere as cheap as me, a number of those will only work on 2.4GHz networks which makes using the Google Wifi a right pain[^1]. I did eventually get the devices registered but only after many *many* repeated pairing/registration attempts. Presumably they would randomly latch onto the 2.4GHz network and be able to complete the process but it was frustrating work.

[^1]: Things I discovered were missing after spending quite a lot on Google Wifi hardware: 
    - No separate 2.4 and 5GHz networks
    - No way to disable the built in DHCP
    - No way to have clients use DNS servers that aren't the router (you can specify your own upstream DNS but all clients will be directed to the router)

The internet also tells us just how all these cheap devices are realistically insecure and that you should be keeping them on a separate network so with that I decided to upgrade my network gear so I could implement secure things, like VLANs and ACLs and all of that fun stuff but I was using a Google WiFi mesh and although it did the job pretty well it just didn't offer *any* power user features at all - primarily it didn't do VLANs, or even more than one WiFi network which meant getting any sort of separation from my potentially badly behaved devices was next to impossible.

So I upgraded the hardware. 

<!--more-->

My networking gear of choice has been [TP-Link's Omada](https://www.tp-link.com/uk/omada-sdn/) line of Software Defined Networking (SDN)[^2] products and for the most part it's been a pretty fun journey, a little more eventful than I would have liked but fun nonetheless. 

[^2]: See the aforementioned "cheap". [Ubiquiti's Unifi](https://www.ui.com/wi-fi) gear is just a little too steep for my liking - even if it does have more features than Omada's current line-up (for now).

## The problem

{{< figure src="images/Network Diagram.drawio(2).png" title="Communication between Home Assistant and the TV just refused to work" alt="A diagram of my current network layout" class="image" caption="Communication between Home Assistant and the TV just refused to work." >}}

As is typical with this sort of thing I soon discovered that local control[^3] of my Samsung smart TV from my Home Assistant instance just straight up stopped working. At first I thought I'd done something incorrectly in the network setup so tore it all done and started from scratch. This didn't fix anything though so I did what I probably should have done first and went to the home assistant documentation, [I found this tiny statement](https://www.home-assistant.io/integrations/samsungtv/#subnetvlan) that the integration doesn't work when VLANs and subnets are involved and that I should probably use IP masquerading or a proxy or something. 

[^3]: Via [Home Assistant](https://www.home-assistant.io/), see [this post]({{< ref "../2020-06-29-home-assistant-in-docker-pt1/index.md" >}}) and [this post]({{< ref "../2020-06-30-home-assistant-in-docker-pt2/index.md" >}}) for some information about how I've got those setup
Not really much to go on.

So off to [DDG](https://duckduckgo.com) I went and turned up [this helpful comment](https://github.com/home-assistant/core/issues/35049#issuecomment-893194912) on the Github issue that spawned the aforementioned tiny documentation statement.

> I read somewhere a remark that it's the TV that's unable/refusing to communicate using websockets across subnets, rather than the client having issues or network being unable to route traffic. - [@owlcall](https://github.com/owlcall)

Owlcall went on to detail an Nginx configuration that acts as an in-subnet proxy service Home Assistant can use to access the TV. This was great and exactly what I needed, except I'd rather use [Traefik Proxy](https://traefik.io/traefik/) for this sort of thing and since I was already running an [Avahi](https://avahi.org/) mDNS reflector[^4] container in a way that spanned multiple VLANs I had an easy way to configure things for my network.

[^4]: Unfortunately only needed because, unlike Unifi, Omada has yet to build it in. [Despite it being a long standing requested feature](https://community.tp-link.com/en/business/forum/topic/243494).

```yml
services:
    #...

    # multi-home the reflector across all relevant VLANs
    mdns_reflector:
        image: flungo/avahi:multiarch
        restart: unless-stopped
        networks:
            vlan_lan:
                ipv4_address: 192.168.11.254
            vlan_serv:
                ipv4_address: 10.5.0.254
            vlan_iot:
                ipv4_address: 10.107.0.254
        environment:
            - REFLECTOR_ENABLE_REFLECTOR=yes
            - SERVER_USE_IPV6=no

networks:
    #...

    # configure 802.1Q VLAN networks that containers needs access to.
    vlan_lan:
        name: vlan_lan
        driver: macvlan
        driver_opts:
            parent: eth0.1 # VLAN 1
        ipam:
            config:
                - subnet: 192.168.11.0/24
                  gateway: 192.168.11.1
    vlan_iot:
        # ... VLAN 107
    vlan_serv:
        # ... VLAN 5
```

## A solution

With a working network spanning namespace provided by the mDNS reflector detailed above it's actually fairly simple to setup a Traefik instance to act as the proxy that we need. 

```yml
services:
    #...

    samsungtv_proxy:
        image: traefik:v2.6
        restart: unless-stopped
        network_mode: service:mdns_reflector
        command:
            - "--log"
            - "--entrypoints.ws.address=:8001"
            - "--entrypoints.ws2.address=:8002"
            - "--providers.file.directory=/config"
        volumes:
            - "samsungtv-proxy-config:/config"
```

The primary thing to notice here is that we've joined this container onto the same network namespace as the mDNS reflector. This isn't strictly necessary but it does allow me to run a tidy "networky device container" on a single high IP - in this case 254. Since it's not possible to configure a provider in Traefik from the command line this has been put in a configuration file in the `samsungtv-proxy-config` volume defined above.

```toml
# tv.toml
[tcp.routers.tv]
entryPoints = ["ws"]
rule = "HostSNI(`*`)"
service = "tv"

[tcp.routers.tv2]
entryPoints = ["ws2"]
rule = "HostSNI(`*`)"
service = "tv2"

[[tcp.services.tv.loadbalancer.servers]]
address = "10.107.0.29:8001"

[[tcp.services.tv2.loadbalancer.servers]]
address = "10.107.0.29:8002"
```

Its a simple enough setup that just proxies the raw TCP connections through (unlike the full HTTP proxy Owlcall put together in Nginx). The important thing that should be noticed here is that the IP address of the TV is hardcoded. It's *probable* that you'd be able to find a way to automate the discovery of it but realistically the easy option is just to assign it a static IP.

{{< figure src="images/Network Diagram.drawio(3).png" title="With a networky-device-container in place things are working great" alt="A diagram of my current network layout with mdns repeater in place" class="image" caption="With a __networky-device-container__ in place things are working great." >}}

## A gotcha

One of the things the Docker macvlan documentation won't tell you is that when you put containers in a macvlan the host machine won't be able to contact them. As you can see from the diagram this is something I've been able to avoid by running the proxy container on a raspberry pi which runs little else. Fortunately there are plenty of [blog posts out there detailing the steps to fix this oversight](https://blog.oddbit.com/post/2018-03-12-using-docker-macvlan-networks/#host-access).