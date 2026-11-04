# Phone build 1 — verification

241 works, all covered by real museum paintings. The final four choices are recorded in CHOICES.md. Every selected image is CC0; artist death dates, museum credits, official image URLs and crop coordinates are in credits.json. There are 140 distinct paintings; some meaningful matches recur across works.

The original literary blocks match the supplied catalogue byte-for-byte after JSON decoding. The 14 copied reference modules still match the read-only Quest source receipts. The spring class and main poster/reader pointer-gesture block match the approved prototype exactly. No Quest files were changed.

Passed: 10 state and failure checks; browser reading flow; bookmarks and a real Shelf; 241 Library entries and search; size controls; saved-place restoration after restart; explicit completion; saved thoughts; complete offline restart with loaded covers; new arrivals held until leaving a reading; swaps preserving the other two works; invalid picks retaining the last good trio; exact original words in the reader; swipe selection, finger-following opening, pull-down return and reduced motion. Browser checks reported no JavaScript or resource errors.

The browser saved-place check reopened the same passage within 8 pixels. This checks a real paragraph/character anchor, not merely the same title. Test account responses were used for Drive merge and arrival checks; no real Google account was accessed or written by these checks.

Not yet proven: real-account Google consent/backup recovery and physical iPhone operation. They need the owner’s device and account. The copied Google client is already configured for https://p0champ.github.io; a different hosting origin requires Google setup. Localhost on this PC cannot be opened as an iPhone website.

Publication is separate from building and testing. Until publication is approved, this build stays local. No paid plan, API, trial, domain or account was enabled. The managed Cloudflare backup code was not used.

Save points: step-1-approved-design, step-2-working-phone-app, step-3-verified-offline. These are Git tags in this separate phone project. Personal reading data is kept outside source rollback.
