---
name: viral-clip-director
description: Technical architecture and asset pipeline for rendering 9:16 vertical C-SPAN / brainrot split-screen MP4 exports for TikTok and X.
---

# Viral Clip Director Skill

This skill defines the technical specification for the automated **[LEAK TO C-SPAN / EXPORT SHORT]** viral generator in **EXECUTIVE DEGEN: SHORT THE WORLD**.

---

## 1. The 9:16 Vertical Video Layout Architecture

```
┌───────────────────────────────────────────────┐
│              1080 x 1920 (9:16)               │
├───────────────────────────────────────────────┤
│ [TOP WINDOW (50%): C-SPAN SENATE HEARING]     │
│  - Stylized 3D Senator slamming wooden gavel  │
│  - Easel holding player's actual in-game Yap  │
│    printed on giant foam core poster board    │
│  - Timestamp: 3:14 AM                         │
│  - Bouncing kinetic yellow subtitles (TTS)    │
├───────────────────────────────────────────────┤
│ [BOTTOM WINDOW (50%): HYPNOTIC BRAINROT]      │
│  - High-FPS gameplay canvas:                  │
│    (Subway Surfers loop / Kinetic sand /      │
│     Soap-cutting ASMR / Hydraulic press)      │
│  - Top overlay: "Wait till the end 💀"        │
└───────────────────────────────────────────────┘
```

---

## 2. Audio Compositing Specification
* **Track 1 (Voiceover):** Automated rasping, dry geriatric boomer text-to-speech reading the player's 3:00 AM Yap verbatim:  
  *"Can the Executive explain to this committee why on Tuesday at 3:14 AM, you posted, and I quote: 'Shorting European timber so I can buy Lake Como for 400 bucks lmao get rekt'? Director, what does 'get rekt' mean for the American worker?"*
* **Track 2 (Punctuation SFX):** Bass-boosted Vine Boom (`.ogg`) on every exclamation mark and capitalized word.
* **Track 3 (Sub-Audio):** Quiet ambient Subway Surfers coin collection and skateboard grinding SFX.

---

## 3. Client-Side Export Pipeline
1. Render Top Window and Bottom Window onto an off-screen HTML5 `<canvas>` (1080x1920 @ 30 FPS).
2. Synthesize audio via Web Audio API buffers.
3. Encode via `MediaRecorder` or WebCodecs into `.mp4` / `.webm`.
4. Trigger automated download into player's local directory: `/Clips/Senator_Cooked_You.mp4`.
5. Copy auto-generated caption to clipboard:  
   `Bro is NOT beating the insider trading allegations 💀😭 #executivedegen #senatehearing #wallstreetbets`
