---
author: adam
date: "2020-07-15T17:33:00+01:00"
month: "2020/07"
slug: home-assistant-in-docker-pt2
tags:
- raspberrypi
- home-assistant
- docker
- docker-compose
- portainer
- traefik
title: Running Home Assistant in docker on a Raspberry Pi - Part 2
year: "2020"
---

Welcome to the second part of a multipart series where we setup a Home Assistant instance in Docker. We've already installed Ubuntu server on Raspberry Pi and have an instance of [Portainer](https://www.portainer.io/) running. If you want to see how we got this far then check out [part 1](../2020-06-29-home-assistant-in-docker-pt1/)

In this instalment we'll be solidifying how we configure our environment. We'll also be setting up [Traefik](https://docs.traefik.io/) to act as the frontend to our web applications and getting our Raspberry Pi a permanent home on the internet, and we'll revisit Portainer so that it works in our new Traefik driven world.

{{< callout >}}
This guide is aimed at an intermediate level. It assumes a certain amount of comfort in the Linux command line.
{{< /callout >}}

<!--more-->

## Step 4 - Tidying up our configuration

If you've followed the steps so far you'll have a `home-assistant-config` folder with a single `docker-compose.yml` file in it. The knowledgeable amongst you may have noticed that that file contained an environment variable and you're probably wondering how we keep that working in the future. 

Something you probably want to do when setting up your compose files is have all of the configuration that's specific to your setup, or is supposed to be a secret, kept separate. In a cloud environment or container cluster you might find that there are mechanisms to manage them so that they're kept safe and secure. When using docker on this small scale we can fall back on environment variables to do that job. `docker-compose` is fully aware of environment variables when it runs, and as a bonus is also capable of automatically loading them from a file. This is the approach I like to use.

```shell script
cd ${HOME}/src/home-assistant-config

# Lets make a new file to store our environment configuration
#   and add our data storage variable to the new file
echo PERSIST_DATA_PATH="${HOME}/src/home-assistant-config" > .env
```

We'll be adding other values to the file as we go along so keep it handy.

## Step 5 - Installing Traefik

"[Traefik](https://docs.traefik.io/) is an open-source Edge Router" that allows us to easily configure and make available the services that we're going to be running on our system. It's got some great features that allow it to work with Docker and automatically publish services as they start up.

> We'll be using Traefik's Host rules to decide which service/s to direct our web traffic to. This means you will need a way to create your own resolvable hostnames. You could use your hosts file, or add a system resolver like [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html) which you can add entries to. I use [Pi-hole](https://pi-hole.net) which lets me set custom entries[^1].
>
> I'll be using a domain that is only accessible on my home network. 

Lets start by adding the Traefik container configuration to our `docker-compose.yml` file. 

```yml
# docker-compose.yml
services:
    #...

    reverse-proxy:
        container_name: reverse-proxy
        # The official v2.2 Traefik docker image
        image: traefik:v2.2
        command:
            - "--api.dashboard=true"
            - "--entrypoints.web.address=:80"
            - "--entrypoints.websecure.address=:443"
            - "--providers.docker=true"
            - "--providers.docker.exposedbydefault=false"
            - "--providers.docker.network=traefik_proxy"
            - "--certificatesresolvers.le=true"
            - "--certificatesresolvers.le.acme.email=${LETSENCRYPT_ACME_EMAIL}"
            - "--certificatesresolvers.le.acme.storage=/etc/traefik/ssl/acme.json"
            - "--certificatesresolvers.le.acme.httpchallenge=true"
            - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
        restart: always
        networks:
            - traefik_proxy
        extra_hosts:
            # this host, though not important now will allow traefik
            # to address home assistant later.
            - host.docker.internal:172.17.0.1 
        ports:
            - 80:80
            - 443:443
        volumes:
            # So that Traefik can listen to the Docker events
            - /var/run/docker.sock:/var/run/docker.sock:ro
        labels:
            - "traefik.enable=true"
            - "traefik.http.routers.dashboard.rule=Host(`traefik.${INTERNAL_DOMAIN}`)"
            - "traefik.http.routers.dashboard.entrypoints=web"
            - "traefik.http.routers.dashboard.service=api@internal"
        logging:
            options:
                max-size: 10m
    
    #...

networks:
    traefik_proxy:
        name: traefik_proxy
        driver: bridge
        ipam:
            config:
                - subnet: 172.24.0.0/16 # not so important what these are
                  gateway: 172.24.0.1 # as long as they're unique on your system
```

One of the differences to our Portainer container definition from part 1 is that we've added some labels. These ones tell the Traefik container (i.e. itself) to setup some routing so that it can be surfaced. We're telling it that it'll be available on port __80__ via the `web` entrypoint and that the service it'll connect to is called `api@internal`

You'll also notice that we've also added a new configuration block for a network called `traefik_proxy`. This network is how traefik will communicate with the service containers that you want to share and helps us to separate internet traffic from the different types of traffic that we might have within our Docker system. Because we'll be running some services directly attached to the host network interfaces we've also added some details in the form of `extra_hosts` that allows that communication.

We'll also need to add some configuration for it to our environment file. __These values will be unique to your set up, make sure to change them!__

```shell script
# set the letsencrypt email
echo LETSENCRYPT_ACME_EMAIL=your@email.here >> .env

# set your internal domain (maybe something like pi.lan)
echo INTERNAL_DOMAIN=pi.lan >> .env
```

With both these file alterations in place we are now able to bring it all up.

```shell script
sudo docker-compose up -d
```

Now, assuming you've setup a suitable hosts file, or local dns or some other way to resolve the host you've configured (and you have used the internal domain __pi.lan__) you should be able to access your new Traefik dashboard at http://traefik.pi.lan and, everything having gone well, it'll show some green ticks alongside your routers and services.

## Step 6 - Some Portainer fiddling (optional)

Now we're going to make some changes to the Portainer settings that we created last time. We're going set things up so that our Portainer instance does not expose it's own ports and instead we'll have it so that you can access things through Traefik.

Replace the `portainer` stanza in the `docker-compose.yml` file with this:

```yml
    #...

    portainer:
        container_name: portainer
        image: portainer/portainer:1.24.0
        restart: always
        networks:
            - traefik_proxy
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - portainer-data:/data
        labels:
            - "traefik.enable=true"
            - "traefik.http.routers.portainer.rule=Host(`portainer.${INTERNAL_DOMAIN}`)"
            - "traefik.http.routers.portainer.entrypoints=web"
            - "traefik.http.routers.portainer.service=portainer"
            - "traefik.http.services.portainer.loadbalancer.server.port=9000"
        logging:
            options:
                max-size: 10m

    #...
```

There are a few of changes here that are important. First we have added our Portainer container to the `traefik_proxy` network, allowing Traefik to communicate with it. We have removed the exposed ports as we do not need those any more. Finally, we have added `labels` to the definition that tell Traefik's docker provider how and where to make our service available.

Now, tell docker to reconfigure our application. `docker-compose` is intelligent enough to only reconfigure/restart the parts that have changed so you should see it tell you that it is __recreating__ Portainer.

```shell script
sudo docker-compose up -d
```

If you've not hit any problems your Portainer instance will restart and will (after a short delay) be available at http://portainer.pi.lan

## Step 7 - Giving it an internet home

Realistically this is a big problem space. There are many solutions you could implement to get your Raspberry Pi on the internet so I'm going to talk of a few and then show you what I did. 

### Getting incoming requests to the Pi

This is a little beyond the scope of this article but to put it briefly you're going to want to setup some sort of port-forwarding on your router so that incoming requests from the internet get routed to your Raspberry Pi. This is entirely dependent on your brand of router and the abilities your ISP has given you - but mostly it's a simple process involving a few clicks.

### Dynamic DNS

Generally the simplest solution to getting a name for your Pi, this involves using a 3rd party service like [DynDNS](https://dyndnss.net/eng/) or [DuckDNS](https://duckdns.org/) to give you a url you can use that will point at your IP address. You'll get an account, select a domain name from their supported list, enter your IP and it's done. You'll probably want to setup some sort of auto-update client on your Pi so that the IP is updated when it changes (not all of us have static IP addresses!).

### My solution

I was using [DuckDNS](https://duckdns.org/) to give me a domain that I was then pointing to in a CNAME record on my personal domain. This worked but I've since cut out the middleman and now directly update the Cloudflare DNS record from my Pi.

Firstly, add a new service and network definition (optional[^2]) to your `docker-compose.yml` file.

```yml
#docker-compose.yml
services:
    #...
  
    dyndns:
        container_name: dyndns
        image: oznu/cloudflare-ddns:latest
        restart: always
        networks:
            - host_applications
        environment:
            API_KEY: "${CLOUDFLARE_API_KEY}"
            ZONE: "${DYNDNS_ZONE}"
            SUBDOMAIN: "${DYNDNS_SUBDOMAIN}"
    
    #...

networks:
    #...

    host_applications:
        name: applications
        driver: bridge
        ipam:
            config:
                - subnet: 172.18.0.0/24
                  gateway: 172.18.0.1
    
    #...
```

You're also going to need to update your `.env` file with some configuration values

```shell script
# get a cloudflare api key from your account and set it
echo CLOUDFLARE_API_KEY=yoursupersecurekeyhere >> .env

# choose the dns zone you want to edit
echo DYNDNS_ZONE=example.com >> .env

# and add a subdomain record you want to update
echo DYNDNS_SUBDOMAIN=ha >> .env
```

This will set things up so that going to `ha.example.com` will end up hitting the Traefik instance you have running. We don't currently expose anything there though so I wouldn't expect anything more than a 404 message.

## Step 8 - Next time

We've now set up almost everything we need to get a solid Home Assistant instance running. To be honest a lot of it is overkill but I do love a bit of over engineering. Next time we'll setup the Home Assistant docker-compose project with a standalone MQTT and MySQL instance then we'll ensure it's secured with [Lets Encrypt](https://letsencrypt.org/).

[^1]: I'll talk about this in the future as getting it working alongside this Traefik setup needs a whole article of its own.
[^2]: I like to keep things in various networks other than the default. This isn't strictly necessary but does keep things tidy.