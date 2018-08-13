---
author: adam
date: "2016-07-16T15:37:00+01:00"
description: Using PXE scripts to boot a custom ISO on Vultr
month: "2016/07"
tags:
- devops
- vultr
- rancheros
title: Deploying Rancheros on Vultr Instances
year: "2016"
---

One of things I've been playing with of late is a Docker container orchestration system called <a href="http://rancher.com">Rancher</a>. I've been very excited to discover the features and capabilities the developers have created and despite being quite new it's extremely well polished - for the most part it <em>just works</em>.

One of the projects they'd developed alongside their software is an operating system called <a href="http://rancher.com/rancher-os/">RancherOS</a>. It's a light weight linux installation that runs it's userspace entirely from within containers; the init process is docker itself. This allows the systems to run with very low overhead once booted and devote as much of their resources to the serving of your containers as is possible.

RancherOS being a relatively new kid on the block though is not available in the selection of operating systems that you can install when creating a new virtual machine on my cloud provider of choice <a href="http://www.vultr.com">Vultr</a>. Fortunately for me though Vultr lets you use PXE network booting and let you add OS install options by uploading the appropriate scripts. In my searches on how to use this capability I stumbled across Vultr's <a href="https://www.vultr.com/docs/install-rancher-os-via-ipxe">own documentation</a> on installing RancherOS using this method. Using this I was up and running RancherOS instances within minutes and I was happy.

But soon I wasn't quite so happy; although the PXE script got me up and running in a couple of minutes it missed out a few things that I really wanted to be automated such as the setting of my ssh key, the addition of the private network and the setting of the hostname. It was at this point I discovered that RancherOS supports cloud-init and all the goodies that provides and so I was set. I just needed a way to pull the necessary information into a <em>cloud-init.yml</em> file and have that read by the booting operating system. RancherOS to the rescue again as it allows you to run a script in place of a <em>cloud-init.yml</em> file. I was ready to go.

First up my iPXE script

{{< highlight bash >}}
#!ipxe
# Boots RancherOS in Ramdisk with persistent storage on disk /dev/vda
# Location of Kernel/Initrd images
set base-url http://releases.rancher.com/os/latest
kernel ${base-url}/vmlinuz rancher.state.formatzero=true \
rancher.cloud_init.datasources=['url:http://example.com/cloud-init.sh']
initrd ${base-url}/initrd
boot
{{</ highlight >}}

You can see just how simple this is. I'm saying where the newest RancherOS is, I'm passing a couple of parameters, then I'm telling it to boot. The <strong>formatzero</strong> parameter allows me to reset a host by writing 1MB of zeros to the start of the disk and then rebooting. Upon startup the system will reinstall itself using the instructions from the cloud-init file, which I then tell it about in the <strong>datasources</strong> parameter.

The <em>cloud-init.sh </em>is a shell file that allows us to fetch the information we need and get installing.

{{< highlight bash >}}
#!/bin/sh

V4_PRIVATE_IP=`wget -q -O - http://169.254.169.254/current/meta-data/local-ipv4`
HOSTNAME=`wget -q -O - http://169.254.169.254/current/meta-data/hostname`

cat > "cloud-config.yaml" <<EOF
#cloud-config
hostname: $HOSTNAME
ssh_authorized_keys:
  - ssh-rsa ...
write_files:
  - path: /etc/ssh/sshd_config
    permissions: "0600"
    owner: root:root
    content: |
      AuthorizedKeysFile .ssh/authorized_keys
      ClientAliveInterval 180
      Subsystem	sftp /usr/libexec/sftp-server
      UseDNS no
      PermitRootLogin no
      ServerKeyBits 2048
      AllowGroups docker
rancher:
  network:
    dns:
      nameserver:
        - 8.8.8.8
        - 8.8.4.4
    interfaces:
      eth0:
        dhcp: true
      eth1:
        address: $V4_PRIVATE_IP/16
        mtu: 1450
  state:
   fstype: auto
   dev: LABEL=RANCHER_STATE
   autoformat:
     - /dev/vda
EOF

sudo ros install --no-reboot -f -c cloud-config.yaml -d /dev/vda
sudo reboot
{{</ highlight >}}

This script does essentially three things. First it uses the Vultr API to pull down some information we need to setup our VM correctly. It then writes out a YML file using this information. This YML file sets my SSH key, sets up SSHD to be a little more secure, adds the private network and tell RancherOS how to go about installing itself to the virtual harddisk (/dev/vda). Finally, it tells the RancherOS system to install itself on the specified disk, using the config file just created and then reboot. 

When it comes back up the system is ready to be added to the Rancher software as an available host. This isn't currently automated but now that I think about it i'm fairly certain thats something achievable.