---
author: adam
date: "2020-06-29T15:26:00+01:00"
month: "2020/06"
slug: home-assistant-in-docker-pt1
tags:
- raspberrypi
- home-assistant
- docker
- docker-compose
- portainer
- traefik
title: Running Home Assistant in docker on a Raspberry Pi
year: "2020"
---

Welcome to the first part of a multipart series that will detail getting Home Assistant running in Docker on your RaspberryPi. We'll be installing Docker on an Ubuntu server instance running on Raspberry Pi. It will expose the services it runs through an instance of Traefik - that will automatically configure SSL certificates and it will give you a management interface called Portainer so that you can directly control the services running. 

{{< callout >}}
This guide is aimed at an intermediate level. It assumes a certain amount of comfort in the Linux command line.
{{< /callout >}}

<!--more-->

### Things you will need

 1. A [RaspberryPi 4](https://thepihut.com/products/raspberry-pi-4-model-b?variant=20064052740158). You can do this on a version 3 but the performance is noticeably slower. I'd recommend the 4GB version as it gives you the headroom you need without the expense of 8GB you probably won't be utilising.
 2. A decently speedy class 10 SD card. I've got an 8GB one, I'd recommend bigger.

## Step 0 - Installing an operating system

Until [very recently](https://www.raspberrypi.org/forums/viewtopic.php?f=117&t=275370) the official Raspberry Pi OS ([~~Rasbian~~Raspberry Pi OS](https://www.raspberrypi.org/downloads/raspberry-pi-os/)) was not fully 64 bit. Although it ran a 64bit kernel it used a 32bit userspace. This is fine for day to day tinkering and use but complicates docker usages as most arm compatible docker images available are 64 bit only. To fix this we must install a fully 64 bit OS. Feel free to use the beta software linked above but I went with [Ubuntu 20.04 LTS](https://ubuntu.com/download/raspberry-pi). I could fill this post up with instructions on how to get that running but the fine people at Canonical have done a [much better job](https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi#1-overview). I left out the optional desktop components as my Pi will be headless[^1] and made sure SSH was up and running and that I could connect.

Once you're sat looking at a command line prompt you're ready to continue.

## Step 1 - Install docker

```shell script
# necessary dependencies 
sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common

echo "deb [arch=arm64] https://download.docker.com/linux/ubuntu focal stable" | sudo tee > /etc/apt/sources.list.d/docker.list 
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-get update -qq
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose
sudo docker ps
```

That final command should show you a nice list of nothing. To check your docker is all up and ready try running the official hello world

```shell script
sudo docker run hello-world
```

## Step 2 - Make docker volumes more sane (optional)

Volumes in docker are a way of storing the persistent data that your docker containers creates. Ordinarily you would create a volume with a command like `docker volume create my-volume` and somewhere in your filesystem (usually _/var/lib/docker/volumes/my-volume_) it would appear. But I want to have more control over where these are created so that I am able to have them be a part of my home assistant configuration. This is where [docker-local-persist](https://github.com/MatchbookLab/local-persist) comes in. It lets me continue to use the docker volume semantics but I can choose where a particular volumes stores it's files.

Because we are running an an arm64 based computer the standard packages that have been built for this docker plugin will not work for us. Fortunately we can get it running quite easy by building it ourself.

### Get ready to build Golang apps
```shell script
# Might want to add this to your ~/.bashrc (optional)
export GOPATH="${HOME}/src/go"
export PATH="${GOPATH}/bin:${PATH}"

# Setup our build environment
sudo apt-get install golang
mkdir -p ${GOPATH}/bin
curl https://glide.sh/get | sh
```

### Build the plugin
```shell script
# Fetch the local-persist source
mkdir -p ${GOPATH}/src/github.com/MatchbookLab
cd ${GOPATH}/src/github.com/MatchbookLab
git clone https://github.com/MatchbookLab/local-persist.git
cd local-persist/

# Install dependencies
glide install

# Build our arm64 binary
make binary
```

### Install the plugin and set it up to run using systemd
```shell script
# The install process
sudo mv bin/local-persist /usr/bin/docker-volume-local-persist
chmod +x /usr/bin/docker-volume-local-persist 
sudo mv init/systemd.service /etc/systemd/system/docker-volume-local-persist.service
sudo systemctl daemon-reload
sudo systemctl enable docker-volume-local-persist
sudo systemctl start docker-volume-local-persist

# Just in case
sudo service docker restart
```

Realistically not too much of a complex procedure though I appreciate its got quite the number of commands. After you run all this you'll find that the plugin is up and running and ready to use in your home assistant instance. But it won't actually be doing anything yet. First we'll have to create a volume that uses it, which neatly leads us on to...

## Step 3 - Install Portainer, our container management software (optional)

{{< figure src="images/portainer.png" title="A screenshot showing the Portainer GUI" alt="A sceenshot showing the Portainer GUI" >}}

[Portainer](https://www.portainer.io/) provides an easily navigable GUI that helps you to manage your docker container workload. It's not necessary to run it in order to manage the containers on your Raspberry Pi but it a little easier to visualise whats going on with your system and provides remote management of your running services without having access to SSH.

In this guide we're going to be getting it up and running but in future parts we'll be altering the configuration to make it a little more secure.

```shell script
# Lets make a place to store our configuration
export PERSIST_DATA_PATH="${HOME}/src/home-assistant-config"
mkdir -p ${PERSIST_DATA_PATH}/data
cd ${PERSIST_DATA_PATH}
```

Put the contents of the following into a file named `docker-compose.yml`. You could use vim, nano, or any number of programs to do this.

```yml
# docker-compose.yml
version: '2.4'

services:
    portainer:
        container_name: portainer
        image: portainer/portainer:1.24.0
        restart: always
        ports:
            - 9000:9000
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - portainer-data:/data
        logging:
            options:
                max-size: 10m

volumes:
    portainer-data:
        name: portainer-data
        driver: local-persist
        driver_opts:
            mountpoint: "${PERSIST_DATA_PATH}/data/portainer-data"
```

Now that we've got our portainer service defined we can run docker-compose with this file and bring up our service. The file we've defined above will ensure that our data is stored in our chosen persistence location (using the plugin we installed earlier) and that the Portainer service will be available on port 9000. We also mount the `docker.sock` socket and this gives our Portainer service the rights it needs to manage your Docker entities.

```shell script
# Bring up our defined services and detach into the background
sudo docker-compose up -d
```

When you're returned to your prompt you will be able to go to a web browser and access your Pi's IP at port _9000_ and see your Portainer instance up and running. I'd recommend you take the time to register your admin account and have a play around in the interface. It's a very powerful piece of software.

## Step 4 - Next time

In part 2 of this guide we'll set up some more useful software. We'll configure and enable a web-proxy to front all our web traffic to the things we'll install, giving us more control over how our services are accessed - it also handles our SSL certificates for us so that we don't have to worry about our traffic being snooped on. We'll get a database running so that we can store the comprehensive history data that Home Assistant spits out and finally we'll expose it to the world with some dynamic DNS.

[^1]: A headless computer has no monitor, mouse or keyboard and just sits there blinking lights at you. This complicates matters when it stops responding to you but that doesn't happen, much.