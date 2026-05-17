---
name: react-native-best-practices
description: Provides React Native performance optimization guidelines for FPS, TTI, bundle size, memory leaks, re-renders, and animations. Applies to tasks involving Hermes optimization, JS thread blocking, bridge overhead, FlashList, native modules, or debugging jank and frame drops.
license: MIT
metadata:
  author: Callstack
  tags: react-native, expo, performance, optimization, profiling
---

# React Native Best Practices

## Overview

Performance optimization guide for React Native applications, covering JavaScript/React, Native (iOS/Android), and bundling optimizations. Based on Callstack's "Ultimate Guide to React Native Optimization".

## When to Apply

Reference these guidelines when:
- Debugging slow/janky UI or animations
- Investigating memory leaks (JS or native)
- Optimizing app startup time (TTI)
- Reducing bundle or app size
- Writing native modules (Turbo Modules)
- Profiling React Native performance
- Reviewing React Native code for performance

## Priority-Ordered Guidelines

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | FPS & Re-renders | CRITICAL |
| 2 | Bundle Size | CRITICAL |
| 3 | TTI Optimization | HIGH |
| 4 | Native Performance | HIGH |
| 5 | Memory Management | MEDIUM-HIGH |
| 6 | Animations | MEDIUM |

## Optimization Workflow

Measure → Optimize → Re-measure → Validate

## Critical: FPS & Re-renders

Common fixes:
- Replace ScrollView with FlatList/FlashList for lists
- Use React Compiler for automatic memoization
- Use atomic state (Jotai/Zustand) to reduce re-renders
- Use useDeferredValue for expensive computations
- Avoid inline functions/objects in render (create outside or useMemo)

## Critical: Bundle Size

Common fixes:
- Avoid barrel imports (import directly from source)
- Remove unnecessary Intl polyfills only after checking Hermes API
- Enable tree shaking (Expo SDK 52+ or Re.Pack)
- Enable R8 for Android native code shrinking

## High: TTI Optimization

Common fixes:
- Disable JS bundle compression on Android (enables Hermes mmap)
- Use native navigation (react-native-screens)
- Preload commonly-used expensive screens

## High: Native Performance

Common fixes:
- Use background threads for heavy native work
- Prefer async over sync Turbo Module methods
- Use C++ for cross-platform performance-critical code

## Animations

Rules:
- Always use Reanimated for 60fps animations (runs on UI thread)
- Use useAnimatedStyle + withTiming/withSpring
- Never animate with setState — causes JS thread re-renders
- Use LayoutAnimation only for simple layout changes

## Lists

Rules:
- Use FlashList instead of FlatList (2-5x faster)
- Always set estimatedItemSize on FlashList
- Use getItemType for heterogeneous lists
- Avoid keyExtractor that forces string conversion — use key prop
- Never nest ScrollView inside FlatList/FlashList

## Memory

Rules:
- Clean up subscriptions/timers in useEffect return
- Use WeakRef for caches
- Avoid storing large objects in global/context state
- Use Image.prefetch sparingly — each cached image consumes memory

## TextInput

Rules:
- Use uncontrolled TextInput when possible (avoid re-render per keystroke)
- Use defaultValue instead of value when you don't need controlled input
- Debounce onChange handlers that trigger expensive operations

## Problem → Fix Mapping

| Problem | Fix |
|---------|-----|
| App feels slow/janky | Measure FPS → Profile React → Fix re-renders |
| Too many re-renders | React Compiler or manual memo |
| Slow startup (TTI) | Analyze bundle → Reduce size → Disable compression |
| Large app size | Analyze app → R8 → Remove unused deps |
| Memory growing | Check useEffect cleanup → Check subscriptions |
| Animation drops frames | Move to Reanimated worklets |
| List scroll jank | Switch to FlashList |
| TextInput lag | Use uncontrolled components |
