---
title: GPU Shaders Gave Us a 10x on Document Scanning
date: 2020-11-20
description: How my team at Dropbox achieved a 10x performance gain in mobile document scanning by moving from CPU-bound C++ to GPU shaders.
tags: mobile, gpu, performance, ios
---

# GPU Shaders Gave Us a 10x on Document Scanning

Point your phone at a piece of paper. Tap a button. Get a clean, cropped, contrast-enhanced scan. It feels like it should be trivial. Phones have had cameras for 15 years. But behind that tap is a pipeline of computationally expensive operations that will humble you if you try to run them on a CPU.

I've been working on Dropbox Scan, and the journey from "working prototype" to "fast enough that users don't notice the processing" involved rethinking our entire image processing architecture. The short version: we got a 10x+ performance improvement by moving from C++ on the CPU to shaders on the GPU. The long version is the rest of this post.

## What "Scanning" Actually Means

When a user takes a photo of a document, the raw camera image is basically useless as a scan. It has perspective distortion (the phone wasn't perfectly parallel to the page), barrel distortion from the lens, uneven lighting, background clutter, and whatever color cast the ambient light introduced.

Turning that into something that looks like it came from a flatbed scanner requires several processing stages:

**Edge detection.** Find the document boundaries in the image. This means identifying four corners of a roughly rectangular shape against an arbitrary background. Sounds simple until you consider that the document might be on a white desk, partially occluded by a finger, sitting at a 30-degree angle, or wrinkled.

**Perspective correction.** Once you have four corners, you need to apply a projective transformation to map the trapezoidal document region onto a rectangle. This is a matrix multiplication per pixel, applied to a multi-megapixel image.

**Color correction and enhancement.** Normalize the white balance, boost contrast, remove shadows. For text documents, you often want an adaptive thresholding step that makes the background pure white and the text pure black, even if the lighting was uneven across the page.

**Noise reduction.** Camera sensors introduce noise, especially in low light. You need to reduce noise without destroying text sharpness, a balancing act that has kept image processing researchers busy for decades.

Each of these stages operates on every pixel in the image. A 12-megapixel photo has 12 million pixels. Multiply by the number of operations per pixel, multiply by the number of stages, and you start to understand why this isn't trivial.

## The C++ Approach

Our initial implementation used a C++ image processing library. This is a reasonable starting point. C++ is fast, portable across iOS and Android, and there's a massive ecosystem of battle-tested image processing code.

The pipeline looked roughly like this:

```
Camera capture (12MP image)
    -> Decode JPEG to raw pixel buffer (CPU)
    -> Edge detection via Canny + Hough transform (CPU)
    -> Perspective warp via affine/projective transform (CPU)
    -> Adaptive thresholding for contrast (CPU)
    -> Noise reduction via bilateral filter (CPU)
    -> Encode result to JPEG/PNG (CPU)
```

Every stage runs sequentially on the CPU. The image data lives in main memory. Each stage reads the full image, processes it, and writes the result back to memory for the next stage.

On a modern iPhone, this pipeline took roughly 2-3 seconds for a 12-megapixel image. That's with optimized C++, NEON SIMD intrinsics, and careful memory management. On mid-range Android devices, it was closer to 5-6 seconds.

Three seconds doesn't sound catastrophic, but it destroys the user experience. You want scanning to feel instant. Tap, done. A three-second spinner after every capture makes users wonder if the app froze. And if they're scanning a multi-page document (which is the main use case for a document scanner), those seconds compound. Twenty pages at three seconds each is a full minute of waiting.

## Why CPU Is the Wrong Tool

The fundamental problem is that image processing is embarrassingly parallel. Every pixel can be processed independently of every other pixel (for most operations). A CPU, even a modern mobile CPU with 6 cores, processes pixels in relatively small batches. It's a general-purpose processor doing specialized work.

A GPU, on the other hand, has hundreds or thousands of small cores designed specifically for this kind of parallel computation. A modern mobile GPU (Apple's A-series, Qualcomm's Adreno) can process thousands of pixels simultaneously. It's literally built for the job. Apple just [announced the M1 chip](https://www.apple.com/newsroom/2020/11/apple-unleashes-m1/) this month with an 8-core GPU pushing 2.6 teraflops. The message is clear: GPU compute is where Apple is investing, and Metal is the only path forward now that [OpenGL is deprecated](https://developer.apple.com/metal/).

But there's more to it than raw parallelism. The memory architecture matters too. In the CPU pipeline, data moves like this:

```
Camera -> GPU (for preview) -> CPU memory (for processing) -> GPU (for display)
```

The image starts on the GPU (the camera hardware feeds directly into the GPU for the viewfinder preview), gets copied to CPU memory for our processing pipeline, then gets copied back to the GPU for display. Those copies are expensive. Moving 12 megapixels of data across the memory bus takes real time.

In a GPU pipeline:

```
Camera -> GPU (for preview AND processing AND display)
```

The data never leaves the GPU. No copies, no bus transfers. The image arrives on the GPU from the camera and stays there through every processing stage until it's displayed or encoded.

## The Shader Pipeline

A shader is a small program that runs on the GPU, typically operating on one pixel (or a small neighborhood of pixels) at a time. The GPU executes the shader across all pixels in parallel.

Our GPU pipeline replaced each C++ processing stage with a shader:

**Edge detection shader.** Computes the Sobel gradient at each pixel, then applies non-maximum suppression. The Hough transform for line detection is trickier on the GPU (it's an accumulation operation, not purely per-pixel), but we can do the gradient computation on the GPU and the line voting on the CPU with much less data.

**Perspective correction shader.** This is where the GPU really shines. A projective transform is a matrix multiplication per pixel, exactly the kind of operation GPUs are optimized for. What took the CPU hundreds of milliseconds takes the GPU single-digit milliseconds.

**Adaptive threshold shader.** For each pixel, sample a neighborhood, compute the local mean, and threshold against it. This is a texture sampling operation, which GPUs have dedicated hardware for. The neighborhood sampling that kills CPU cache performance is orders of magnitude faster on a GPU thanks to dedicated texture sampling hardware.

**Bilateral filter shader.** A bilateral filter preserves edges while reducing noise by weighting neighboring pixels based on both spatial distance and color similarity. It's computationally expensive (each pixel reads a large neighborhood), but the parallel execution on the GPU makes it tractable.

The architectural difference isn't just about individual operations being faster. It's about the pipeline as a whole. In the CPU version, each stage runs sequentially, and data is copied between stages. In the GPU version, stages can be chained using framebuffer objects. The output of one shader becomes the input texture for the next, with no data leaving the GPU.

## Making It Accessible with Swift Wrappers

Writing raw Metal (Apple's GPU API) or OpenGL ES shaders is possible but painful. The boilerplate for setting up render pipelines, managing textures, configuring framebuffers, and handling device capabilities is extensive and error-prone.

WWDC 2020 doubled down on this direction with sessions like [Discover Ray Tracing with Metal](https://developer.apple.com/videos/play/wwdc2020/10012/) showing compute shaders doing real-time intersection testing entirely on-GPU. The tooling is maturing fast.

This is where open-source frameworks like [GPUImage](https://github.com/BradLarson/GPUImage) become invaluable. GPUImage wraps GPU programming in an object-oriented Swift interface. Instead of writing Metal pipeline descriptors and command encoders, you compose a processing chain:

```swift
let edgeDetection = SobelEdgeDetection()
let perspectiveCorrection = PerspectiveTransform()
let threshold = AdaptiveThreshold()
let filter = BilateralBlur()

camera --> edgeDetection --> perspectiveCorrection --> threshold --> filter --> output
```

Under the hood, GPUImage handles texture allocation, framebuffer management, shader compilation, and the OpenGL/Metal state machine. You write processing logic; the framework handles GPU plumbing.

This is a significant productivity multiplier. Our team could iterate on the image processing pipeline (tuning thresholds, adjusting filter parameters, adding or removing stages) without anyone needing to be a GPU programming expert. The abstraction isn't free (there's some overhead from the framework layer), but it's negligible compared to the CPU-to-GPU improvement.

## The Numbers

After moving to the GPU pipeline:

- **12MP image processing**: ~200ms (down from ~2500ms). Over 10x improvement.
- **Memory pressure**: Significantly reduced. No large intermediate CPU buffers between stages.
- **Battery impact**: Lower than expected. The GPU completes the work so much faster that total energy consumption actually decreased despite the GPU being less energy-efficient per operation.
- **Multi-page scanning**: Users can scan 20 pages in the time the old pipeline took to process 2.

The 200ms number is fast enough that we can run the pipeline on every preview frame, not just the captured image. This means the user sees a real-time preview of what the scanned document will look like before they tap the capture button. That preview is what transforms document scanning from "take a photo and hope" to "WYSIWYG scanning."

## The Gotchas

GPU programming on mobile isn't all sunshine.

**Device fragmentation (Android).** GPU drivers on Android are a minefield. The same shader that works perfectly on a Qualcomm Adreno might produce visual artifacts on a Mali GPU, or crash outright on an older PowerVR chip. We maintain a compatibility matrix and fall back to the CPU pipeline on devices with known GPU driver bugs.

**Precision issues.** Mobile GPUs typically use half-precision (16-bit) floating point by default. For most image processing this is fine, but adaptive thresholding with small neighborhoods can produce banding artifacts at half precision. We force full precision for the threshold stage.

**Debugging.** When a CPU function produces the wrong output, you set a breakpoint and inspect variables. When a shader produces the wrong output, you stare at a garbled image and try to reason about what went wrong in a massively parallel execution context. GPU debugging tools (Xcode's Metal debugger, RenderDoc) have improved a lot, but they're still nowhere near the CPU debugging experience.

**Thermal throttling.** Sustained GPU workload (e.g., scanning a 50-page document) can trigger thermal throttling on some devices, which reduces clock speeds and makes performance unpredictable. We monitor thermal state and adjust quality settings dynamically, reducing preview frame rate or processing resolution when the device gets warm.

## When to Reach for the GPU

Not every image processing task needs the GPU. If you're resizing a thumbnail or applying a simple color filter to a small image, the overhead of setting up a GPU pipeline outweighs the benefit. The CPU is fine.

The GPU becomes the obvious choice when:

- You're processing large images (8MP+)
- You're applying multiple sequential operations
- You need real-time or near-real-time performance
- You're already displaying the result on screen (the data is already on the GPU)

Document scanning hits all four criteria. The performance improvement isn't incremental. It's the difference between a feature that feels broken and one that feels magical.

The broader lesson is about matching the computation to the hardware. Mobile devices have powerful GPUs that sit idle in most apps because developers default to CPU-based solutions. The frameworks exist to make GPU programming accessible. The performance gains are dramatic. If your app does anything computationally intensive with images, audio, or video, the GPU should be your first instinct, not your last resort.
