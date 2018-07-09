---
title: "Ansible deployment of DNS zone files"
slug: "ansible-dployment-of-dns-zone-files"
date: 2016-01-08T16:09:00+00:00
description: "Creating the DNS setup I want using configuration as code"
author: adam
tags: 
  - devops
  - ansible
  - dns
coverimage: ansible
---

I've recently started to refactor my server configuration[^1]. It's always been built with [Ansible](http://www.ansible.com) but it was one of the first things I ever did using that and I was fairly certain that every way I could have been doing it wrong I was.

<!--more-->

One of the things I'd wanted to do was rationalise what was in my playbooks. They should ideally be all code and no configuration but I was using **many** templates for various system files and they were mostly configuration for content, not services - the chief culprits being dns zone and nginx/apache vhost files. When you refer to a template from with a playbook it expects that the files are inside the playbook itself. This just doesn't seem right to me. You can specify absolute locations though and so with a bit of finagling I was able to get the files where I wanted. The magic is to do something like

{{< highlight yaml >}}
{{ inventory_dir }}/../templates/zones/*.j2
{{< /highlight >}}

**inventory_dir** is the absolute path to your main inventory file and so we can use this to point at a global templates folder with a bit of path manipulation. As you can see I'm stepping up out of the hosts folder and then down into templates.

This works really well but there was another thing I wanted to do. I was configuring the zones that I had to populate on the system using normal vars files (a simple list object with domain names in), and then using that to grab the templates to put on the system. This struck me as wasteful. The addition of a new domain meant that I had to add the file and then amend an array just to inform Ansible to read the file. There had to be a better way. Sure enough *with_fileglob* came to the rescue. This allows Ansible to parse a path for files and then gives us the tools necessary to feed our provisioning. With a bit of Jinja2 manipulation magic I ended up with this

{{< highlight yaml >}}
- name: Install zone files
  template:
  src: "{{ item }}"
  dest: /etc/bind/zones/{{ item | basename | regex_replace("\.j2$","") }}
  owner: root
  group: root
  mode: 0644
  register: zone_files
  with_fileglob:
    - "{{ inventory_dir }}/../templates/zones/*.j2"
  notify:
    - reload bind9
{{< /highlight >}}

The final piece of this puzzle was to make sure that each of these zone files were referred to in the Bind configuration. I scratched my head over this for a bit and then it occurred I could register the results of the above action as a variable and use it in the template for that file. So I registered *zone_files* and set about concocting a template loop

{{< highlight yaml >}}
{% for zone in zone_files.results %}
zone "{{ zone.item | basename | regex_replace("\.db\.j2$","") }}" {
   type master;
   file "/etc/bind/zones/{{ zone.item | basename | regex_replace("\.j2$","") }}";
   allow-transfer { slaves; };
};
{% endfor %}
{{< /highlight >}}

It didn't turn out too complicated in the end - certainly very readable but the end result is a much nicer playbook with all configuration being both more succinct and living in appropriate places.

[^1]: Something that happens way too often.