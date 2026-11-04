# Read toggle fix

The end-of-text Read button and the reading-menu Read action now toggle the exact work between read and unread. Both stay enabled and expose their current state to assistive technology. The existing 1 of 3 counter, artwork, colours, layout, gestures and reading typography are unchanged.

Undo removes the completion and clears only daily ticks assigned to that exact edition. Assignments, reading places, bookmarks, ratings, thoughts, other works and earned gifts remain. Shelf drops the Read label; it can still show Continue or Saved because those are separate facts.

Timestamped phone-only edit records preserve undo across old backups and stale Drive copies. They are projected into the existing completion ledger and exact-edition day ticks. The most recent undo is retained separately after a later re-read so newly arriving old historical days do not regain their corrected ticks. Re-reading sets only the current matching daily tick back to read. A sync requested during another upload is drained before the queued request finishes.

Tested: 22 unit/state checks and an iPhone-sized desktop-browser test covering both controls, enablement, history, unchanged assignments and other daily ticks, stale-copy sync round trip, offline reload, Shelf Continue/Saved labels and the unchanged counter. Independent review caught and verified fixes for late-arriving historical days and anonymous ticks acquiring an edition. No browser page errors remained.

Browser sync checks used isolated fake Drive responses, never the owner’s Google account. Physical iPhone undo and real-account sync remain untested. The unchanged Quest clients do not implement these new phone edit records; they can still show older local read state or discard metadata. As before, the Drive read/merge/write has no conditional-write transaction across simultaneous devices. This fix does not claim atomic multi-device sync or a Quest-app update. The Quest project and copied core files were not changed.

The new maps are optional fields in the existing version-1 backup, so existing phone data opens without reset. Tombstones remain in exports and sync copies; restoring a stale copy cannot silently discard them. Failed uploads keep the pending undo locally for retry.
