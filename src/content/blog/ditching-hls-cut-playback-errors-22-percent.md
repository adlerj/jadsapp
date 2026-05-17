---
title: We Ditched HLS and Cut Playback Errors by 22%
date: 2022-08-12
description: How I rebuilt Reddit video playback by ditching HLS for an LRU-based prefetch cache, cutting playback errors meaningfully.
tags: video, mobile, performance, ios
---

# We Ditched HLS and Cut Playback Errors by 22%

Streaming protocols are designed for streaming. This sounds obvious, but it's the root cause of a class of performance problems that plague every platform trying to serve short-form video.

When I dug into video performance at [Reddit](/blog/why-i-joined-reddit), I found a system that had been designed for long-form content and never re-evaluated when the content mix shifted. The competitive landscape has changed dramatically: TikTok hit a billion monthly active users last year, Instagram launched [Reels](https://about.instagram.com/blog/announcements/introducing-instagram-reels) in 2020, and YouTube is pushing [Shorts](https://blog.youtube/news-and-events/building-youtube-shorts/). Every platform is competing for short-form video engagement, and the technical foundation for serving that content needs to be fundamentally different from what worked for long-form. The result was a pipeline that was architecturally wrong for the dominant use case. Fixing it meant rethinking most of the existing video infrastructure and rebuilding the parts that mattered. The payoff: roughly an order-of-magnitude improvement in video startup performance and a 22% reduction in playback errors.

Here's what was broken and how I fixed it.

## The wrong protocol for the content

The video system used HLS (HTTP Live Streaming) with adaptive bitrate streaming. HLS works by splitting a video into small segments (usually 2-6 seconds each) and letting the player request progressively higher or lower quality segments based on available bandwidth.

This is brilliant for a 45-minute TV episode. Start with a low-quality segment while you measure the connection, then ramp up to 1080p once you know the bandwidth can handle it. The viewer barely notices the first few seconds of lower quality because they're watching for an hour.

Now consider the actual content mix. The dominant content on the platform was short-form: clips under 10 seconds. TikTok-length content, memes, quick takes. With a dominant segment length of 2-6 seconds, a 7-second video is one or two segments.

This creates an impossible tradeoff for adaptive bitrate:

**Start with a low-quality segment:** The video is blurry for the entire duration. By the time the player would normally ramp up to higher quality, the video is over. The user sees a blurry clip. This is particularly painful for advertisers, who don't want their ads showing up blurry the whole time.

**Start with a high-quality segment:** First load takes longer on average connections. The user stares at a loading spinner for a second or two before a short video plays. The perceived performance is terrible even though the video itself looks great once it starts.

Neither option is acceptable. This is the core tension of HLS in a short-form world: adaptive bitrate streaming solves a problem that doesn't exist for short-form video and creates problems that wouldn't otherwise exist.

## No coordination between players

The second problem was architectural. `AVPlayer` instances were being created directly inside reusable cells in the feed. That alone is questionable, but it was compounded by a structural issue: the listing framework hosting the video feed didn't reuse cells well.

The result: as a user scrolled through their feed, every video cell created a new `AVPlayer`. Scroll past 20 videos and you have 20 `AVPlayer` instances alive simultaneously. Each one independently buffering content, contending for network bandwidth, consuming memory, and holding references to system media resources.

These players were completely unaware of each other. No coordination, no prioritization, no concept of "the user can only see two videos on screen, maybe we shouldn't buffer the other 18." Scroll back up and the players you left behind were still buffering content the user would never see.

On devices with limited memory (which, for a platform this large, is a significant portion of the user base), this caused crashes. On constrained networks, it caused bandwidth starvation. Twenty players competing for a 3G connection, none of them getting enough bandwidth to play smoothly.

## The old architecture

Here's what the pipeline looked like:

```
User scrolls feed
  |
  v
Cell created (no reuse)
  |
  v
New AVPlayer allocated
  |
  v
AVPlayer requests HLS manifest
  |
  v
AVPlayer picks quality (adaptive bitrate)
  |
  v
AVPlayer buffers first segment
  |
  v
(User scrolls past)
  |
  v
AVPlayer continues buffering in background
  x 20 simultaneous players
```

Every step compounded the problem. No reuse means unbounded player creation. HLS means each player does its own manifest fetch and quality selection. No coordination means no way to tell players to stop when they're off screen. The system was working as designed. It was just designed for the wrong content.

## The rebuild

I rebuilt the video infrastructure around three core ideas: use the right format for short content, coordinate playback centrally, and predict what the user needs next.

### MP4 over HLS for short-form video

For videos under a threshold duration (calibrated to cover the vast majority of content), I switched from HLS to plain MP4 downloads. Instead of letting a streaming protocol negotiate quality, the system manages quality profiles explicitly.

The video repository maintains a mapping of available quality profiles for each video. When it's time to fetch a video, the system selects a quality profile based on current bandwidth estimates and connection type:

```
Strong WiFi   -->  1080p MP4
Weak WiFi     -->  720p MP4
LTE           -->  720p MP4
3G            -->  480p MP4
Poor signal   -->  360p MP4
```

This decision happens once, at the application level, with full context about the device's current conditions. No per-segment negotiation, no adaptive bitrate overhead, no quality ramp-up period. The first frame of the video is the quality you chose, and it stays that way.

For longer videos that actually benefit from adaptive streaming, the system falls back to HLS. The protocol isn't wrong. It's just wrong for short clips.

### The video repository and LRU cache

The core of the new system is a video repository that coordinates all downloads and manages an LRU (Least Recently Used) cache.

```
Video Repository
  |
  |-- Download Queue (priority-ordered)
  |-- LRU Cache (bounded, ~5-8 videos)
  |-- Player Pool (reusable AVPlayer instances)
  |-- Bandwidth Monitor (running average)
```

The cache holds a small number of fully or partially downloaded videos. When the cache is full and a new video needs to be cached, the least recently viewed video is evicted. This keeps memory bounded regardless of how far the user scrolls.

The download queue is priority-ordered based on proximity to the viewport. The video the user is currently watching has highest priority. The next video in the scroll direction has second priority. Everything else is deprioritized or cancelled.

### Scroll-direction-aware prefetching

This is where the system gets predictive. The video repository monitors scroll direction and velocity to figure out which videos to download next.

```
Scrolling down at moderate speed:
  Priority 1: Currently visible video (finish download)
  Priority 2: Next video below viewport (prefetch)
  Priority 3: Video two below viewport (prefetch if bandwidth allows)
  Cancel:     Videos above viewport (user scrolled past)

Scrolling up (reversed direction):
  Priority 1: Currently visible video
  Priority 2: Next video above viewport
  Cancel:     Pending downloads for videos below

User stopped scrolling:
  Priority 1: Currently visible video(s)
  Priority 2: Adjacent videos in both directions
```

The direction detection uses a simple heuristic: track the last N scroll offset changes, compute the trend. If the user reverses direction, the system cancels downloads that are no longer relevant and starts fetching what's now ahead.

This sounds simple but the impact is substantial. Without direction-aware prefetching, the system would blindly prefetch in both directions, wasting half the bandwidth on videos the user has already scrolled past. With it, nearly every prefetch is a cache hit when the user arrives at the next video.

### Progressive playback

One of the nicest properties of MP4 over HLS: you can start playing before the download completes. MP4s with the `moov` atom at the front of the file (which we ensure during transcoding) allow the player to begin decoding as soon as enough data arrives.

The video repository streams MP4 data into the player as it downloads:

```
Download starts
  |
  v
First bytes arrive (moov atom + beginning of mdat)
  |
  v
Player begins decoding and rendering  <-- user sees video
  |
  v
Download continues in background
  |
  v
Download completes, video fully cached
```

On a fast connection, the video starts almost instantly because the first few hundred KB arrive quickly. On a slow connection, the video starts as soon as there's enough data to decode the first frames, while the rest downloads in parallel. Either way, time-to-first-frame is dramatically better than waiting for an HLS manifest fetch, quality negotiation, and first segment download.

### Player pool

Instead of creating and destroying `AVPlayer` instances with each cell, the system maintains a small pool of reusable players. When a cell comes on screen, it borrows a player from the pool. When it goes off screen, the player is returned.

This bounds the number of active players to the number of simultaneously visible cells (typically 1-2) plus a small buffer. Compare that to the old system's unbounded player creation.

The pool also handles the lifecycle correctly. Returned players are reset (current item cleared, playback stopped) but not deallocated. This avoids the cost of `AVPlayer` initialization, which is non-trivial. Creating an `AVPlayer` involves allocating media pipeline resources from the system.

## The new architecture

```
User scrolls feed
  |
  v
Scroll direction + velocity detected
  |
  v
Video Repository updates download priorities
  |
  v
Download Queue fetches MP4 (quality based on bandwidth)
  |
  v
Data streams into LRU Cache
  |
  v
Cell becomes visible --> borrows Player from Pool
  |
  v
Player receives cached/streaming MP4 data
  |
  v
Video plays (first frame from partial download)
  |
  v
Cell scrolls off screen --> Player returned to Pool
  |
  v
LRU eviction if cache is full
```

Every step is coordinated. The repository knows about every video, every download, every player. It makes global decisions instead of letting individual cells fend for themselves.

## Results

The numbers tell the story:

- **~22% reduction in video playback errors.** Fewer player contentions, fewer bandwidth starvation events, fewer out-of-memory crashes.
- **An order-of-magnitude improvement in video startup performance** for the common case (short-form video on a reasonable connection). First frame appears almost instantly because the video is usually prefetched by the time the user scrolls to it.
- **Bounded memory usage.** The LRU cache and player pool mean that scrolling through hundreds of videos uses roughly the same memory as viewing three.
- **Bandwidth efficiency.** Direction-aware prefetching means nearly zero wasted downloads. The old system was downloading content the user would never see; the new system only fetches what's needed.

The advertiser complaints about blurry video stopped after the rollout. When you control the quality profile selection, you can guarantee that ads always play at the highest quality the connection supports.

## Lessons

The meta-lesson is about questioning inherited assumptions. The original team chose HLS because it's the industry standard for video streaming. That's a reasonable default. But defaults need re-evaluation when the use case changes, and short-form video is a fundamentally different use case than the long-form streaming HLS was designed for.

The second lesson is about coordination. Individual components can be well-implemented and still produce a terrible system if they're not aware of each other. Twenty perfectly functional `AVPlayer` instances competing for bandwidth is worse than one mediocre player with a smart download scheduler.

The rebuild took about six weeks of focused work. Most of the time went into the scroll-direction heuristics and edge cases around rapid direction changes, slow connections where downloads don't complete before the user scrolls past, and the interaction between the player pool and cell reuse.

Six weeks to cut playback errors by 22% and improve startup performance by an order of magnitude. Not bad for questioning whether the architecture still fit the problem.
