---
author: adam
date: "2020-07-08T15:33:00+01:00"
month: "2020/07"
slug: giving-an-old-macbookpro-life
tags:
- necrotech
- macbook pro
- apple
- windows 10
- tech
title: Giving an old (old) Macbook Pro life
year: "2020"
---

I decided, the other day, to pull an early 2008 Macbook Pro from it's venerated "I'm too emotionally attached" spot in my tech hoard and breathe some new life into it. This post details the saga of making that happen. 

The laptop in question is an 15" A1260 Macbook Pro 4,1. It was the last model produced before Apple went all machined-one-piece with their chassis technology and it has been __loved__. It's lifetime has seen a 2GB RAM upgrade (its maximum) and a hard drive replacement, it now sports a 500GB Seagate Hybrid drive[^1]. At some point in the recent past I even had to bake it in an oven as the on board Nvidia 8600M graphic chip had seen fit to melt it's own connections to the motherboard.

{{< figure-sizer >}}
  {{< figure src="images/getting-baked.jpg" title="Bake at 200C for 7.5 minutes (no more, no less)" caption="Bake at 200C for 7.5 minutes (no more, no less)" alt="A computer motherboard being placed in an oven" class="image" >}}
{{< /figure-sizer >}}

### Problem 1

Apple ceased supporting this particular model with the release of OSX 10.12 Sierra which means that it's stuck on El Capitan. They also didn't update any of their official Bootcamp drivers beyond the support of Windows 7. I don't want to be running an old and unsupported OS so that leaves me with running Linux.

### Problem 2

This machine is going to someone who wants to use a drawing tablet on it - one that only has Windows and OSX drivers - for recent versions of both. I'm left with no alternative but to attempt Windows 10. 

## The saga begins

I need to rebuild this machine from scratch (due to abortive Linux installs messing up the disk partitions) so I dig out my latest OSX install DVD[^2]. I have to use a physical disc since this machine predates USB booting[^3].

### Most recent supported OSX version

 * Install Snow Leopard and rejoice at the lovely bubbly aqua buttons.
   * __Important__ If you're wanting to install Windows 10 now is the _ideal_ time to setup a partition for it. I went with 100GB for OSX and 400GB for Windows.
 * Run all the updates, rebooting a few times along the way.
 * Download the El Capitan installer from the App Store[^4] and run it.
 * It reboots and you're given an error that "OS X could not be installed on your computer" because "No packages were eligible for install." and that you should restart. Doing so brings you right back to this error. You curse.
 * You repeat all the above, twice, just in case - remembering along the way that installing from DVD takes _aaaaages_.

 You google the problem, without success, whilst installing it all for the 2nd time. Then, in the comments at the bottom of a sort-of-matches article, you find the solution. It turns out the App Store download has expired certificates in it and you need to change your system time. At the error prompt you click __Utilities > Terminal__ and enter `date 010101012016`. You restart, it works and you're soon sat at an El Capitan desktop.

 You run a few more update/reboot cycles and feel happy that you can at least now install Firefox.

 {{< callout >}}
 If you want to skip all this fun, download a fixed installer directly from [Apple](https://support.apple.com/en-us/HT206886), stick it on a USB stick and run that after the "Install Snow Leopard" step. Saves you oh... half a day.
 {{< /callout >}}

### Windows 10 

Bootcamp is what you're thinking here, so you run the assistant and sigh as you read it supports Windows 7 only. It won't even let you sort the Hard Drive out, but fortunately you thought about that earlier when you installed Snow Leopard... you did right?. If not, GOTO 10.

{{< callout >}}
If you're thinking of following a guide like [this](https://www.reddit.com/r/mac/comments/3fjyn2/install_windows_10_with_boot_camp_drivers_on_old/) so you can use a USB drive to install Windows; don't. The version of Windows that the [Media Creation Tool](https://www.microsoft.com/en-gb/software-download/windows10) downloads does not support BIOS booting from USB and will **only** boot using UEFI in spite of what [Refind](https://www.rodsbooks.com/refind/) will offer.

__This notice brought to you by an entire day of cursing at the fact it should all be working yet wasn't__
{{< /callout >}}

You whack in a Windows DVD, reboot and are overjoyed to see the familiar blue Windows logo and a spinner. Following the installer you're happy to see it all progressing smoothly. Some minutes later you're looking a Windows desktop. It's mostly all working, you've got a functioning Nvidia driver, Wifi and ethernet but;

 * The screen is on maximum brightness.
 * The keyboard backlight is non-functional.
 * There's no sound.
 * You can't right click (time to dig out that old USB mouse you've got stashed, if not `fn + shift + F10` might do it).
 * None of the function buttons work.

You figure that you can deal with these issues once it is all up to date - who knows, it might all get fixed (one can hope). So you run through repeated updates and reboots till it's got a shiny green tick. You sigh; everything is still broken.

{{< callout >}}
What follows is my saga, you can bypass it all and just [read this](https://www.reddit.com/r/bootcamp/comments/cesawt/how_to_get_windows_10_1903_working_properly_in/) for mostly complete instructions on how to get things working.
{{< /callout >}}

At this point you're thinking it's all just a matter of drivers, and you're not wrong, but getting them is going to be a pain. Briefly, this is what you try:

 * Boot back into OSX, re-run the Bootcamp Assistant and used the menu option to download the drivers onto USB stick. 
 * In Windows tried to run __Bootcamp.exe__ - fail - needs administrator rights.
 * Run it again as administrator - fail - wrong version of Windows. You cri.
 * Run the individual keyboard driver as administrator - unspecified failure.

 At this point you're not holding up much hope. Then you find an article suggesting that you should try running under compatibility mode. It suggests a tweak and lets you run it. Score! You reboot as it suggests, login and are greeted by a bluescreen. 

{{< figure-sizer size="small" >}}
  {{< figure src="images/rage.jpg" title="This is getting ridiculous" alt="Rage face" class="image" >}}
{{< /figure-sizer >}}

What the hell is a WDF_Violation anyway? You do a quick search and find it's some Bootcamp issue with the 1903 release of Windows. The fix is a simple bit of noodling around in a [command prompt](https://answers.microsoft.com/en-us/windows/forum/all/wdfviolation-blue-screen-error-on-windows-10-after/f4b13bbe-a9a0-4dd0-97d3-3f812a8e043c). But when you try that you find that file doesn't exist anyway. You curse loudly and GOTO 10.

A Windows install, update and Bootcamp setup later you're sat looking at a bluescreen. You resist the temptation to call it a day and resume your searching. You come across a [Reddit post](https://www.reddit.com/r/bootcamp/comments/cesawt/how_to_get_windows_10_1903_working_properly_in/) which looks promising.

 * Reinstall Windows. Run updates.
 * Download [Brigadier](https://github.com/timsutton/brigadier/releases). Ignore the fact it hasn't been updated since 2016
 * Run it at a command prompt `brigadier.exe`
 * It downloads a bunch of promising looking files and then crashes. 
 * Rummage through the source and find it looks to be a certificate issue when downloading 7-zip. See that it checks if you've already got it installed.
 * Install 7-zip and try again.
 * It appears to work.
 * You run __Bootcamp.exe__ using compatibility mode and feel joyous that it doesn't encounter any errors.

Since you didn't read the post properly you reboot... and get a bluescreen. You have a rummage at the rescue prompt for the fabled __MacHalDriver.sys__ and you find it! You do a quick rename, cross your fingers and boot to a functioning desktop. Feeling like you're finally make progress you pick up the Reddit post at the half way point and use Brigadier to download the iMacPro drivers. You install the __AppleHAL__ driver and, desperate for this all to be over, reboot.

### Fin?

You sit looking at a Windows desktop; whilst logging in you heard sound and whilst mouthing silent prayers you find the function buttons successfully stop the screen from blinding you. It's over.

So you go to immortalise your work, heading to the restore point control panel you click create. It fails. It fails the next ~~6~~12 times you try. You search about inconclusively for the error code (0x80042306 in case you were wondering) and find nothing that helps. 45 minutes of failed fiddling later you decide to add the word "bootcamp" to your search and are presented with [this blog](https://www.edandersen.com/2015/07/06/windows-10-on-mac-bootcamp-fixes/). It details the broken Apple driver that you need to disable and how. You follow the steps and with great trepidation attempt to create a restore point. It is successful. 

Now it's over; you go in search of a cup of tea.

[^1]: Back when SSD's were expensive a [hybrid](https://en.wikipedia.org/wiki/Hybrid_drive) was the only affordable option.
[^2]: Coincidently the last one Apple released, OSX Snow Leopard.
[^3]: Well, you can sort of make it happen if you use [Refind](https://sourceforge.net/projects/refind/) but if I included all those efforts in this page it'd be three times longer - and I still wasn't able to make it work.
[^4]: Only available in your purchased items, you did download it back when it was current right?