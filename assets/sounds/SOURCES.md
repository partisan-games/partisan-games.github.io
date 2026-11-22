# Sources of shared sound effects

Owner-selected sources below are labelled CC0 1.0 on their source pages (Ustanak selection checked 2026-11-17; additional candidates checked 2026-11-19). Inputs are public HQ MP3 previews, not original WAV/FLAC downloads. Processing, original/prepared hashes and legacy provenance limits are recorded in [PROCESSING.json](PROCESSING.json); the pre-processing measurements are linked from [TESTING](../../docs/TESTING.md#sačuvani-dokazni-izvori).

| Shared file | Author and source | Basic preparation before final calibration |
|---|---|---|
| aircraft-gun.mp3 | [qubodup — Clean Machine Gun Burst](https://freesound.org/people/qubodup/sounds/482122/) | Mono; one shot with its natural tail, the last of the burst |
| cannon-shot.mp3 | [qubodup — Howitzer Artillery Gun Shot Sound Effect 01](https://freesound.org/people/qubodup/sounds/161343/) | Average-channel mono; source character retained |
| cannon-load.mp3 | [MaximBomba — Rifle-or-shotgun-reload](https://freesound.org/people/MaximBomba/sounds/432141/) | Mono, −4.3 dB; trim empty tail at 2.06542 s with 10 ms fade |
| shell-flight.mp3 | [craigsmith — R12-28-Cannon Shot and Whistling](https://freesound.org/people/craigsmith/sounds/486026/) | Existing 4.72–7.52 s excerpt; 30 ms fade in, 150 ms fade out; unchanged in this preparation |
| fire.mp3 | [craigsmith — R09-70-Building on Fire](https://freesound.org/people/craigsmith/sounds/483313/) | Same accepted fire; 250 ms linear cyclic crossfade, full recording retained apart from overlap |
| wind.mp3 | [dhallcomposer — Gentle Wind on an Open Desert Plain](https://freesound.org/people/dhallcomposer/sounds/697217/) | 16 s stereo loop from 5–21.25 s with 250 ms cyclic crossfade |
| engine-aircraft.mp3 | [craigsmith — Airplane Engine Steady](https://freesound.org/people/craigsmith/sounds/479512/) | 6 s mono loop from 5–11.25 s; 250 ms cyclic crossfade; exact aircraft type is not confirmed |
| engine-boat.mp3 | [AugustSandberg — Marine diesel engine](https://freesound.org/people/AugustSandberg/sounds/264864/) | 6 s loop from 10–16.25 s, 250 ms cyclic crossfade; mono, −1.5 dB; modern Volvo Penta recording |
| engine-diesel.mp3 | [AugustSandberg — Diesel Engine](https://freesound.org/people/AugustSandberg/sounds/237292/) | 6 s loop from 10–16.25 s, 250 ms linear cyclic crossfade; mono, −2.9 dB; exact vehicle type is not confirmed |
| footstep-gravel-01.mp3 through footstep-gravel-12.mp3 | [IENBA — Footsteps On Gravel](https://freesound.org/people/IENBA/sounds/818562/) | Separate mono event excerpts with short edge fades; automatic boundaries remain unauditioned |
| body-impact-01.mp3, body-impact-03.mp3, body-impact-04.mp3 | [Vrymaa — body-impact Foley](https://freesound.org/people/Vrymaa/sounds/734629/) | Separate mono event excerpts with short edge fades; exact cut ranges in processing record |
| water-wake.mp3 | [myLoop — Sailboat Bow](https://freesound.org/people/myLoop/sounds/852108/) | 6 s stereo loop from 10–16.25 s with 250 ms cyclic crossfade; contains wind |
| water-impact.mp3 | [qubodup — Big Water Splash](https://freesound.org/people/qubodup/sounds/442773/) | Mono, −3 dB; a large splash, not a separately recorded underwater detonation |
| metal-impact.mp3 | [RyanKingArt — Metal Impact](https://freesound.org/people/RyanKingArt/sounds/620077/) | Mono, −3 dB |
| air-raid-siren.mp3 | [cocaine — Air Raid Siren](https://freesound.org/people/cocaine/sounds/157463/) (owner-selected 2026-11-20) | One rise-hold-fall cycle, 15.0–29.5 s; mono; 30 ms fade in, 1 s fade out; −5 dB to about −26 LUFS (ambience) |
| rocket-thrust.mp3 | [qubodup — Rocket Boost Engine Loop](https://freesound.org/people/qubodup/sounds/146770/) | Existing mono preview; designed engine effect, not an authenticated lunar recording |

Final calibration uses separate starting targets for engines (−24 LUFS), fire (−22), wind (−30), water wake (−28), water impact (−22), body impacts (−24) and speech (−20). Very short footsteps use RMS/peak measurements rather than invalid integrated loudness: target −30 dBFS RMS with at most 12 dB gain. Peak ceilings constrain gain; these are preparation targets, not a claim that every transient reaches the target. Exact per-file gain, cut ranges and final hashes are in [PROCESSING.json](PROCESSING.json); [post-encoding measurements](../../docs/references/audio/zv06-prepared-2026-11-19.json) cover the installed set. No file in that measurement exceeds 0 dBTP; browser mix peaks, mono audibility, gapless playback and perceptual balance remain unverified.

Other existing recordings have incomplete source/license provenance; retaining or processing them does not establish CC0. Their input hashes and transformations are recorded without inventing authorship. `defeat-swoosh.mp3` bakes the existing UI swoosh's 0.7 playback rate into a separate file, preserving the cue while keeping UI playback pitch fixed. For shots, apply the installed recording's gain only once; do not reapply the preparation trim in the playback profile.

When preparing assets on Windows, normalize relative manifest paths to `/` after changing extensions. Persist each replacement's processing recipe and previous/final hashes together: a resumed preparation must identify already-processed files before applying gain again.

The grenadier's [release cue](grenade-throw.mp3) uses the first 0.36 s of audible sound from the existing [swoosh](fire-swoosh.mp3), SHA-256 `9d88c55a84753027f658f435b6a96f7ed076dda1aad3aec6085310b5ba56dc7b`. FFmpeg filter: `silenceremove=start_periods=1:start_duration=0.005:start_threshold=-48dB,atrim=duration=0.36,highpass=f=220,lowpass=f=6800,afade=t=in:d=0.025,afade=t=out:st=0.18:d=0.18`. Mono, 44.1 kHz, libmp3lame quality 3. Output SHA-256 `e2b2da878af5f451f645569f102f2ea7e68c260e60c8b2731b6fb8ac4f965732`. The original recording's provenance is undocumented.

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

Owner-rejected excerpts must not be reintroduced: body-impact-02 (a quiet hit, then a louder one; 2026-11-21). Owner-rejected candidates must not be reintroduced: Freesound 210428 (small splash), 803852 (space launch), 718967 (human effort) and 849412 (magic impact). Effort grunts are not needed and require no replacement; this does not reject separate body-impact/injury sounds. New recordings require owner selection before installation; preparation parameters do not require a separate decision for every value.
