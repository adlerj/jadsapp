---
title: "We Ditched HLS and Cut Playback Errors by 22%"
date: 2022-08-12
description: How I'm rebuilding video playback for short-form content by ditching HLS, building an LRU-based prefetch cache, and cutting playback errors by 22%.
tags: video, mobile, performance, ios
---

# We Ditched HLS and Cut Playback Errors by 22%

Streaming protocols are designed for streaming. This sounds obvious, but it's the root cause of a class of performance problems that plague every platform trying to serve short-form video.

When I dug into video performance at [Reddit](/blog/why-i-joined-reddit), I found a system that had been designed for long-form content and never re-evaluated when the content mix shifted. The competitive landscape has changed dramatically: TikTok hit a billion monthly active users last year, Instagram launched [Reels](https://about.instagram.com/blog/announcements/introducing-instagram-reels) in 2020, and YouTube is pushing [Shorts](https://blog.youtube/news-and-events/building-youtube-shorts/). Every platform is competing for short-form video engagement, and the technical foundation for serving that content needs to be fundamentally different from what worked for long-form. The result is a pipeline that's architecturally wrong for the dominant use case. Fixing it means deleting most of the existing video infrastructure and rebuilding from scratch. The payoff: roughly a 10x improvement in video performance and a 22% reduction in playback errors.

Here's what's broken and how I'm fixing it.

## The wrong protocol for the content

The video system uses HLS (HTTP Live Streaming) with adaptive bitrate streaming. HLS works by splitting a video into small segments (usually 2-6 seconds each) and letting the player request progressively higher or lower quality segments based on available bandwidth.

This is brilliant for a 45-minute TV episode. Start with a low-quality segment while you measure the connection, then ramp up to 1080p once you know the bandwidth can handle it. The viewer barely notices the first few seconds of lower quality because they're watching for an hour.

Now consider the actual content mix. Approximately 90% of all videos on the platform are about 7 seconds long. TikTok-length clips, memes, quick takes. With a dominant segment length of 2-6 seconds, a 7-second video is one or two segments.

This creates an impossible tradeoff for adaptive bitrate:

**Start with a low-quality segment:** The video is blurry for the entire duration. By the time the player would normally ramp up to higher quality, the video is over. The user sees a blurry 7-second clip. This is particularly painful for advertisers. "Why is my ad blurry the whole time?" is not a conversation you want to have.

**Start with a high-quality segment:** First load takes longer on average connections. The user stares at a loading spinner for a second or two before a 7-second video plays. The perceived performance is terrible even though the video itself looks great once it starts.

Neither option is acceptable. This is the core tension of HLS in a short-form world: adaptive bitrate streaming solves a problem that doesn't exist for short-form video and creates problems that wouldn't otherwise exist.

## No coordination between players

The second problem is architectural. `AVPlayer` instances are being created directly inside reusable cells in the feed. That's already questionable, but it's compounded by a critical issue: the listing framework in use doesn't actually reuse cells.

Let me say that again. The framework that hosts the video feed doesn't support cell reuse.

The result: as a user scrolls through their feed, every video cell creates a new `AVPlayer`. Scroll past 20 videos and there are 20 `AVPlayer` instances alive simultaneously. Each one is independently buffering content, contending for network bandwidth, consuming memory, and holding references to system media resources.

These players are completely unaware of each other. No coordination, no prioritization, no concept of "the user can only see two videos on screen, maybe we shouldn't buffer the other 18." Scroll back up and the players you left behind are still buffering content the user will never see.

On devices with limited memory (which, for a platform this large, is a significant portion of the user base), this causes crashes. On constrained networks, it causes bandwidth starvation. Twenty players competing for a 3G connection, none of them getting enough bandwidth to play smoothly.

## The old architecture

Here's what the pipeline looks like:

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

Every step compounds the problem. No reuse means unbounded player creation. HLS means each player does its own manifest fetch and quality selection. No coordination means no way to tell players to stop when they're off screen. The system is working as designed. It's just designed for the wrong content.

## The rebuild

I'm deleting the existing video infrastructure and rebuilding it around three core ideas: use the right format for short content, coordinate playback centrally, and predict what the user needs next.

### MP4 over HLS for short-form video

For videos under a threshold duration (calibrated to cover the vast majority of content), I'm switching from HLS to plain MP4 downloads. Instead of letting a streaming protocol negotiate quality, the system manages quality profiles explicitly.

The video repository maintains a mapping of available quality profiles for each video. When it's time to fetch a video, the system selects a quality profile based on current bandwidth estimates and connection type:

```
Strong WiFi   -->  1080p MP4
Weak WiFi     -->  720p MP4
LTE           -->  720p MP4
3G            -->  480p MP4
Poor signal   -->  360p MP4
```

This decision happens once, at the application level, with full context about the device's current conditions. No per-segment negotiation, no adaptive bitrate overhead, no quality ramp-up period. The first frame of the video is the quality you chose, and it stays that way.

For longer videos that actually benefit from adaptive streaming, the system falls back to HLS. The protocol isn't wrong. It's just wrong for 7-second clips.

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
- **~10x improvement in video startup performance** for the common case (short-form video on a reasonable connection). First frame appears almost instantly because the video is usually prefetched by the time the user scrolls to it.
- **Bounded memory usage.** The LRU cache and player pool mean that scrolling through hundreds of videos uses roughly the same memory as viewing three.
- **Bandwidth efficiency.** Direction-aware prefetching means nearly zero wasted downloads. The old system was downloading content the user would never see; the new system only fetches what's needed.

The advertiser complaints about blurry video have stopped entirely. When you control the quality profile selection, you can guarantee that ads always play at the highest quality the connection supports.

## Lessons

The meta-lesson is about questioning inherited assumptions. The original team chose HLS because it's the industry standard for video streaming. That's a reasonable default. But defaults need re-evaluation when the use case changes, and short-form video is a fundamentally different use case than the long-form streaming HLS was designed for.

The second lesson is about coordination. Individual components can be well-implemented and still produce a terrible system if they're not aware of each other. Twenty perfectly functional `AVPlayer` instances competing for bandwidth is worse than one mediocre player with a smart download scheduler.

The rebuild takes about six weeks of focused work. Most of the time goes into the scroll-direction heuristics and edge cases around rapid direction changes, slow connections where downloads don't complete before the user scrolls past, and the interaction between the player pool and cell reuse.

Six weeks to cut playback errors by 22% and improve startup performance by an order of magnitude. Not bad for questioning whether the architecture still fits the problem.
