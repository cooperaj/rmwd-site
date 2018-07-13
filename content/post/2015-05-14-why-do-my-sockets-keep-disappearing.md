---
title: "Why do my sockets keep disappearing?"
date: 2015-05-14T13:35:00+01:00
description: "In which I discover the default Nginx setup didn't work for me"
author: adam
tags: 
  - devops
  - nginx
  - froxlor
---

I'm working on getting my <a href="http://froxlor.org">froxlor</a> instance setup with PHP5-FPM and Nginx and was encountering an issue whereupon reboot the PHP functionality would be broken. Looking in syslog would give me about 30 lines of PHP5-FPM failing to start and then giving up. Looking in <em>/var/log/php5-fpm.log</em> would tell me nothing useful other then the configtest passed.

<!--more-->

I eventually found a helpful message in the <em>/var/log/upstart/php5-fpm.log</em> file:

```
[14-May-2015 09:21:54] ERROR: unable to bind listening socket for 
address '/var/run/nginx/username-domain.com-php-fpm.socket': No 
such file or directory (2)
```

True enough the <em>/var/run/nginx</em> folder did not exist. I could not figure out where it was going.

After hair pulling research I found that the <em>/var/run</em> mount point is run as tmpfs and so is deleted on reboot. In order to fix this I had to ensure the directory was recreated before PHP5-FPM started. It turns out this if fairly easy with upstart. I added this stanza:

```
pre-start
    ... other stuff ...
    [ -d /var/run/nginx ] || mkdir -p /var/run/nginx
end script
```

to the <em>/etc/init/nginx.conf</em> file to have the folder created on boot.

Problem solved.