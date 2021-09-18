---
author: adam
coverimage:
date: 2019-07-18T15:48:00+01:00
description: I've been running a RocketChat instance on my Dokku server for a while now and recently I went to upgrade it from the 0.7x release I was running to a more recent 1.2.x version. This post detail how hard that actually ended up being.
month: "2019/07"
tags: 
- devops
- dokku
- docker
- rocketchat
- mongo
- tech
title: "Running RocketChat on a Dokku PAAS server"
year: "2019"
---

I've been running a [RocketChat](https://rocket.chat) instance on my [Dokku](http://dokku.viewdocs.io/dokku/) server for a while now and recently I went to upgrade it from the 0.7x release I was running to a more recent 1.2.x version. This post detail how hard that actually ended up being.

<!--more-->

It turns out that the makers of RocketChat stuck a new requirement into the 1.0 release that threw a spanner in the works for [quite a few people](https://github.com/RocketChat/Rocket.Chat/pull/14227). 

In short, a requirement that the [MongoDB](https://mongodb.com) database was run using [ReplicaSets](https://docs.mongodb.com/manual/replication/) was introduced. The rationale given for this was:

  > Oplog/Replicaset was always required for production deployments, Meteor/Rocket.Chat uses it to handle the data reactivity, that is what makes Rocket.Chat a real time chat. If you run your installation without it, the code fallback to a pooling into database to check for new/updated data what causes problems for many users/installations when the load increases.
  >
  > [29 April 2019 - rodrigok](https://github.com/RocketChat/Rocket.Chat/pull/14227#issuecomment-487570280)

## The issue

I run my RocketChat instance on an installation of the Dokku PAAS[^1]. Dokku makes running these kind of things really very easy and includes a number of service plugins that allow you to hook up things like databases to your applications with little to no configuration. I use Dokku's MongoDB plugin for precisely this reason.

This causes us a problem when we want to deviate from the normal way of doing things and run a configuration that is non-standard. Running MongoDB as a single instance ReplicaSet[^2], unfortunately, is considered non-standard for the Dokku MongoDB plugin.

## The workaround

Noodling around in the way that the MongoDB plugin worked led me to find that it's possible to alter the start parameters. Editing these means that my MongoDB service container could come up configured as a potential member of a ReplicaSet. Sadly this broke the plugin as it does some initial configuration around authentication that doesn't work on a ReplicaSet instance. Boo hiss.

{{< highlight bash >}}
$ export MONGO_CONFIG_OPTIONS="--replSet rs0 --storageEngine wiredTiger --auth"
$ dokku mongo:create my-database
$
$ # this fails as the plugin was not able to setup auth
$ dokku mongo:connect my-database
{{< /highlight >}}

After a few false starts, many github issues and some cursing I came up with a sequence of commands that'll get a single instance ReplicaSet up.

{{< highlight bash >}}
$ unset MONGO_CONFIG_OPTIONS # clean up for justin
$ dokku mongo:create my-database
$
$ # it's now working as you'd expect
$ dokku mongo:connect my-database
> exit
$
$ # if you already have a working Mongo instance you'd start
$ # here. make sure you have backups!
$
$ dokku mongo:stop my-database
$ cd /var/lib/dokku/services/mongo/my-database
$ echo "--replSet rs0 --storageEngine wiredTiger --auth" | \
  sudo tee MONGO_CONFIG_OPTIONS
$
$ # force dokku to accept the new configuration options
$ docker rm dokku.mongo.my-database 
$ dokku mongo:start my-database
{{< /highlight >}}

With those commands you will have setup the Mongo database in a way that the plugin can use it and then added the things we need to let RocketChat use it as a ReplicaSet. Theres a few more steps though as we have to configure the ReplicaSet with it's single instance. 

{{< highlight bash >}}
$ dokku mongo:connect-admin my-database
> use admin
> rs.initiate() # create the replicaset configuration
rs0:SECONDARY> use local
rs0:PRIMARY> exit # this being a PRIMARY is what we want to see
{{< /highlight >}}

I'd worked out an especially complicated way to achieve this and it resulted in having to do some particularly funky things to running containers to get them to talk to each other. It turns out I should have just read the [github issue](https://github.com/dokku/dokku-mongo/issues/88) created against the Dokku Mongo plugin and I would have avoided a world of hurt.

Finally, we need to add a user to the system so that the RocketChat service can pull the information about the ReplicaSet it needs to function.

{{< highlight bash >}}
$ dokku mongo:connect-admin my-database
rs0:PRIMARY> use admin
rs0:PRIMARY> db.createUser({
  user: "oploguser", 
  pwd: "SUPER_SECRET_PASSWORD", 
  roles: [{role: "read", db: "local"}]})
rs0:PRIMARY> exit
{{< /highlight >}}

Ok, so now you've got a working ReplicaSet and you need to tell RocketChat (or some other application) to use it. Sadly we're not going to get to use the wonderful automation that Dokku gives us for this kind of thing but we can replicate what it gives us an implement it manually.

{{< highlight bash >}}
$ # you will have done something like this to get it working
$ dokku mongo:link my-database my-app
$
$ # and your config would now contain
$ dokku config my-app
...
MONGO_URL: mongodb://my-database:DEADBEEF@dokku-mongo-my-database:27017/my-database
...
$ 
$ # you just need to add an additional configuration option
$ dokku config:set my-app \
MONGO_OPLOG_URL=mongodb://oploguser:SUPER_SECRET_PASSWORD@dokku-mongo-my-database:27017/local?authSource=admin&replicaSet=rs0
{{< /highlight >}}

This breaks down as:  
  `oploguser:SUPER_SECRET_PASSWORD`: The username and password you created above  
  `dokku-mongo-my-database`: The hostname given in the MONGO_URL  
  `local`: The database that contains the OpLog that RocketChat uses  
  `?authSource=admin&replicaSet=rs0`: Important configuration

With that final configuration option in place the RocketChat instance should spring into life and you'll breathe a sigh of relief. 

## Conclusion

Don't mindlessly upgrade a piece of software without checking the changelog. Especially on a <1 to >1 version bump.

## Thanks

Thank you to [malixsys](https://github.com/malixsys) for figuring out a much simpler way of configuring the Mongo ReplicaSet to work under Dokku than I'd come up with.

[^1]: [Platform As A Service](https://en.wikipedia.org/wiki/Platform_as_a_service)
[^2]: A ReplicaSet lets you cluster your MongoDB instance so that the downtime of an instance will not cause the failure of a service. Running a ReplicaSet for a single instance makes little sense since you have none of the upsides and all the additional effort.