# Known Issues — v1.0.0

## Low priority (post-hackathon)
- Tier 3 AI Vision matching not implemented
- Payment flow checks UI-only (no sandbox transactions)
- No authentication on instructor portal (open for demo)
- Screenshots saved to disk — not served via API yet

## Workarounds
- Private repos: student must make repo public before submission
- Gemini rate limit: max ~60 requests/min — large assignments (30+ reqs) may slow enrichment
- Session manager: student app must allow registration at /register path

## Edge cases handled
- Private GitHub repo → graceful error stored, no crash
- Dead live URL → error stored, submission marked as error
- Gemini API timeout → fallback to needsClarification
- BullMQ job failure → retry 3x with exponential backoff
