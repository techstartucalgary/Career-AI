# Showcase Demo Checklist

## Required Profile Fields (10 pts each, 80 pts max)

These fields must be populated for the demo to fill applications correctly.

- [ ] **first_name** OR **display_name** — profile.first_name, or display_name to split
- [ ] **last_name** — profile.last_name, or inferred from display_name (2+ words)
- [ ] **email** — root-level `email` field
- [ ] **phone** — profile.phone (any format, normalized automatically)
- [ ] **location** — profile.location as "City, Province/State" (e.g. "Calgary, AB")
- [ ] **citizenship_or_location_country** — either root `citizenship` field, or 2+ part location for inference
- [ ] **resume** — resume.file_data (base64-encoded PDF)
- [ ] **positions** — job_preferences.positions or auto_apply_settings.positions

## Recommended Fields (4 pts each, 20 pts max)

These improve form fill quality but aren't blocking.

- [ ] **linkedin_url** — profile.linkedin
- [ ] **github_url** — profile.github
- [ ] **experience** — resume.extracted_data.experience (parsed from resume)
- [ ] **education** — resume.extracted_data.education (parsed from resume)
- [ ] **skills** — resume.extracted_data.skills (parsed from resume)

## Readiness Scoring

- **60+** — "Find Jobs" button enabled
- **< 60** — Button disabled, missing fields shown as warning
- **100** — All fields populated

Check readiness: `GET /api/showcase/check-profile`

## Work Authorization Inference

The field mapper infers work authorization from location when `citizenship` and
`work_authorization_status` root fields are empty:

- Location "Calgary, AB" -> province AB -> Canada -> work_auth_canada = "Yes"
- Location "San Francisco, CA" -> state CA -> United States -> work_auth_us = "Yes"

To set explicit citizenship for the demo user, set in MongoDB:
```
db.users.updateOne(
  { email: "demo@example.com" },
  { $set: { citizenship: "Canadian citizen", work_authorization_status: "citizen" } }
)
```

## Running the Demo

1. Set env: `SHOWCASE_MODE_ENABLED=true`, optionally `SHOWCASE_HEADFUL=true`
2. Start backend: `python main.py`
3. Open frontend, navigate to Auto-Apply page (showcase UI loads automatically)
4. Click "Find Jobs" (requires readiness >= 60)
5. Watch live: discovery -> matching -> extraction -> form fill -> ready
6. Submit is always disabled in showcase mode

## Notes

- CAPTCHA detection is skipped in showcase mode (forms are never submitted)
- Screenshots are captured during form fill and sent via SSE
- The browser closes automatically when the cycle ends or "End Demo" is clicked
