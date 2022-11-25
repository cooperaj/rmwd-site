---
author: adam
coverimage:
date: 2022-11-25T19:18:49Z
description: This deployable Dokku project implements a proxying service that allows you to front S3 Object storage served files from the configured domain.
month: "2022/11"
tags: 
- mastodon
- s3
- fediverse
- dokku
- devops
- tech
title: "S3 and S3-compatible bucket proxy in Dokku"
slug: "s3-bucket-proxy-in-dokku"
year: "2022"
---

It turns out that running a [Mastodon](https://getmastodon.com) instance, and hooking that instance up to a couple of relays will *very* quickly fill up the measly storage space on your VPS. To combat that you've got 2 options; 1) add more space[^1] or, 2) hook up some object storage like Amazon's S3 or Vultr's, err, [Object Storage](https://www.vultr.com/products/object-storage/). Since Mastodon natively supports the latter it seemed like a no brainer to me so I followed the [official documentation](https://docs.joinmastodon.org/admin/config/#files) and in doing so found instructions on [setting up an Nginx proxy](https://docs.joinmastodon.org/admin/optional/object-storage-proxy/). To do this optional bit I needed to come up with a [Dokku](https://dokku.com) based solution, and [this is it](https://github.com/cooperaj/dokku-s3-proxy).

This deployable Dokku project implements a proxying service that allows you to front S3 Object storage served files from the configured domain. You may want to do this to, for example, retain control of your files apparent storage location and therefore allowing you to move your files later without having to implement redirects to the old content.

It also acts as a content cache and provides a 48 hour TTL. Additionally it implements cache locking to prevent [cache slams/stampedes](https://en.wikipedia.org/wiki/Cache_stampede)

Finally, it has inbuilt filtering that *only* allows __GET__ operations to reach the bucket, therefore acting as a rudimentary firewall.

<!--more-->

## Lets go

### Assumptions

Your storage bucket will need to give this proxy read access to it's contents. The implementation of this is outside of the scope of this file but it is important that you not misconfigure and allow unfettered write access to your bucket. 

If you’re following these instructions you will be using a lot of your own information so, to that end, anywhere you see something like `${YOUR_*}` you’ll need to put your own values in.

Here are the things you’ll need to know:

 - `YOUR_DOMAIN` - Where your instance will live on the internet e.g. “files.example.com”.
 - `YOUR_APP_NAME` - What dokku will call your app. e.g. “s3_proxy”.
 - `YOUR_S3_BACKEND` - The url given by your provider that points to your bucket. e.g. "my-bucket.s3.eu-west-1.amazonaws.com"

### Pulling the project

You'll want to pull this project to a local folder

```bash
git pull github.com/cooperaj/dokku-s3-proxy ${YOUR_DOMAIN}
cd ${YOUR_DOMAIN}
```

### Setting it up

```bash
DOKKU_HOST=${YOUR_DOMAIN} dokku apps:create ${YOUR_APP_NAME}

# At this point you have an app and Dokku is able to figure out your host
# using that, so no need to specify the DOKKU_HOST

# Set our website domain
dokku domains:set ${YOUR_DOMAIN}
```

Now we want to configure our proxy with the S3 bucket details we need

```bash
# Tell our app where the S3 bucket lives
dokku config:set S3_BACKEND=${YOUR_S3_BACKEND}
```

## Running it!

You can now push the project and watch it appear on the internet.

```bash
git push dokku
```

If all goes well you should see your project build and deploy and finally be presented with a successful deployment message with your URL. You'll then be able to access the bucket contents as if they lived at that url (and not in object storage).

## Final configuration

Some configuration options can only take effect once the app is running/pushed, in this case turning on LetEncrypt SSL support.

```bash
# Enable LetsEncrypt
# If it's your first time you may be prompted to set the administrator email
dokku letsencrypt:enable
```

## Mastodon Migration

{{<callout>}}
If you've used [my guide](https://realmenweardress.es/2022/11/running-your-own-mastodon-instance/) to deploy a Dokku based Mastodon instance you will likely want to pull that repos updates as I have added some bits that redirect old links to the new location.
{{</callout>}}

As I have been running [my instance](https://social.n8e.dev) for a while already using the default Paperclip driver I had approximately 35GB of files to migrate and various configuration entries to change. Using [cybrespace's guide](https://github.com/cybrespace/cybrespace-meta/blob/master/s3.md) as the bulk of it I got to this set of commands.

Optionally, we can clean up media files older than X days to minimise sync time with the storage. Navigate to the location you checked out the [github.com/cooperaj/dokku-mastodon](https://github.com/cooperaj/dokku-mastodon) repository - [as per my guide](https://realmenweardress.es/2022/11/running-your-own-mastodon-instance/).

```bash
# In your dokku-mastodon checkout.
dokku enter web /app/www/bin/tootctl media remove --days=7
```

We need to do an initial file sync to the bucket. First, on your Dokku server using SSH, setup the [s3cmd](https://s3tools.org/s3cmd) program with your bucket info. You'll need your key and secret as well as the region and bucket name.

```bash
# Example configuration
# $YOUR_BUCKET_NAME = my-bucket
# $YOUR_BUCKET_REGION = eu-west-1
# $YOUR_BUCKET_HOSTNAME = s3.eu-west-1.amazonaws.com
s3cmd --configure

# New we do an initial sync of the files
# In the file location from my guide
cd /var/lib/dokku/data/storage/mastodon/mastodon/public/system/

# Sync files in directory. 
export S3_BUCKET=${YOUR_BUCKET_NAME}

# This takes a good while. Maybe run it in a 'Screen' session?
# The "-p 2" parameter is the number of parallel operations, set 
# appropriate to your core count / instance load
find -type f | cut -d"/" -f 2- | xargs -P 2 -I {} \
s3cmd --acl-public sync --add-header="Cache-Control:public, \
max-age=315576000, immutable" {} s3://$S3_BUCKET/$(echo {} \
| sed "s:public/system/\(.*\):\1:")
```

Back on your machine in your dokku-mastodon checkout folder add some new settings. __This will restart your instance and result in downtime.__

```bash
dokku config:set S3_ENABLED=true S3_BUCKET=${S3_BUCKET} \
AWS_ACCESS_KEY_ID=${YOUR_BUCKET_ACCESS_KEY} \
AWS_SECRET_ACCESS_KEY=${YOUR_BUCKET_SECRET_ACCESS_KEY} \
S3_REGION=${YOUR_BUCKET_REGION} S3_PROTOCOL=https \
S3_HOSTNAME=${YOUR_BUCKET_HOSTNAME}\
S3_ALIAS_HOST=${YOUR_DOMAIN}
```

Login to your instance once it comes back up (this can take a while due to init scripts within the LinuxServer.io container) and check that everything appears to be working. Inspect the image urls to see if they're now pointing at `${YOUR_DOMAIN}`. You might find that recent posts/users do not have images which is normal (read on), but if you're missing older media something has not gone right. You'll need to start delving in the logs now to see whats going on. `dokku nginx:access-logs` and `dokku nginx:error-logs` are your friend.

Assuming you're good we need to finally ensure that any cache files that were created in the time between the start of the first sync, and the running of the above configuration changes will need copying across. There's no easy way to do this except to run the same sync command again. Just like the first time it'll take a while.

```bash
# There'll be periods it seems frozen. It's just diligently
# *not* uploading things you've already done above.
find -type f | cut -d"/" -f 2- | xargs -P 2 -I {} \
s3cmd --acl-public sync --add-header="Cache-Control:public, \
max-age=315576000, immutable" {} s3://$S3_BUCKET/$(echo {} \
| sed "s:public/system/\(.*\):\1:")
```

At this point you should now have a fully migrated Mastodon instance using S3 object storage for it's media cache and can, if you're feeling brave, delete the contents of `/var/lib/dokku/data/storage/mastodon/mastodon/public/system/`.

## Acknowledgments 
 * https://github.com/cybrespace/cybrespace-meta/blob/master/s3.md for the starter.  
 * [@dokku@twitter.com](https://twitter.com/dokku) suggesting some command tweaks.

[^1]: Some providers make this easy (Vultr certainly does) but I've also hit issues with it on others that make me weary of it.