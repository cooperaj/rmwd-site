---
author: adam
date: "2022-01-26T16:29:00+00:00"
month: "2022/01"
slug: stpfmmp
tags:
- terraform
- homelab
- pi-hole
- tech
title: STPFMMP (Simple Terraform Playbook For Managing Multiple Piholes)
year: "2022"
---

If you want to run [Pi-hole](https://pi-hole.net/) on your network but not have the entire family grumble that the internet isn't working when you need to reboot the machine it's running on then you'll need to run two Pi-holes. To run two Pi-holes properly they need to a) be on separate machines (I use my main homelab server and a RaspberryPi) and b) be configured on your client devices appropriately.[^1]

{{< figure class="is-pulled-right" src="images/logo.png" title="The Pi-hole application logo" alt="The Pi-hole application logo" width="100px" >}}

If you've got all that working but have been getting annoyed that adding any new service means duplicating manual configuration steps in a clunky Pi-hole web interface then you'll likely have been searching for some sort of automation to handle it. Fortunately I came across a [Terraform](https://www.terraform.io) [provider for Pi-hole](https://registry.terraform.io/providers/ryanwholey/pihole/latest) that got me most of the way there. I just needed to put together a playbook/plan for it. 

So with that. I present [STPFMMP](https://github.com/cooperaj/STPFMMP) (Simple Terraform Playbook For Managing Multiple Pi-holes)

<!--more-->

## Usage

  1. Pull the [STPFMMP](https://github.com/cooperaj/STPFMMP) project to your machine
  1. Copy `domains.json.dist` to `domains.json` and edit accordingly
  1. Copy `secret.tfvars.dist` to `secret.tfvars` and edit accordingly
  1. Ensure your Pi-holes have not already got the entries defined (so delete them if they exist)[^2]
  1. `terraform init`
  1. `terraform plan -var-file=secret.tfvars`
  1. `terraform apply -var-file=secret.tfvars`
  1. ~~Profit~~ Be happy that editing your home network DNS is now not so repetitive/dull/error prone.

Now anytime you want to create or edit or otherwise manage your networks local DNS you can just make changes to the `domains.json` file and run _apply_ again. Everything gets put in the right place and you don't have to go prodding around in the Pi-hole interface.

[^1]: If you're using the primary Pi-hole as a DHCP this is actually fairly easy. Add a new file to the `/etc/dnsmasq.d/` called `07-pihole-dhcp-dns.conf` and in that file add a line like `dhcp-option=6,192.168.100.2,192.168.100.3` (obviously replacing those IP addresses with whatever you're using). Ensure you restart _dnsmasq_. If you're using your router then I'd advise prodding around in whatever setting you have available. Failing that configure your devices manually.

[^2]:  The terraform provider being used has not yet implemented refresh/import support so the only way to get this to work is to ensure you're running it on a blank canvas. I ran the `apply` step multiple times so that I could remove values from one Pi-hole instance at a time.