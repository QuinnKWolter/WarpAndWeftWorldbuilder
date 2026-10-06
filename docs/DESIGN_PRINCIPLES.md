# Design principles

1. **Progressive formalization.** Make a moment, connect it, write. Add chronology, tracked state, and structured metadata when useful.
2. **The canvas is the workspace.** Panels provide context; they should not turn the story into an administrative database.
3. **Time is meaningful.** Reading order and story time are separate controls. A relationship is one connection with a history.
4. **Connections invite invention.** The insertion affordance asks what happens between two moments.
5. **Loose threads belong.** Unplaced ideas and unresolved placeholders are legitimate creative work.
6. **Save visibly and safely.** Acknowledge completed saves, retain pending drafts, surface failures, and keep export within reach.
7. **Quiet visual language.** Warm paper, forest-green accents, fine connection lines, small serif moments, compact controls, and restrained depth. The dark theme uses the same semantic tokens.
8. **Useful alternatives.** Drawers replace permanent columns on phones. Commands, outline controls, and inspectors expose graph actions without requiring a precise drag gesture.
9. **Writer authority.** Diagnostics describe modeled consequences; they do not forbid deliberate ambiguity, flashbacks, or delayed reveals.
10. **Data belongs to the author.** Private defaults, open-source code, no required AI service, and complete portable exports.

Motion stays brief and purposeful: desktop panes animate width, phone drawers slide, folders animate height, list reordering moves siblings smoothly, and dialogs/inspector content enter gently. Graph arrangement interpolates nodes and edges; camera fitting and lens changes animate without remounting the canvas. Content inside a collapsing pane keeps its width to avoid text reflow. Settings provides device preference, Smooth motion, and Reduced motion; the default respects the system. Native selects and options use semantic theme colors.

The World entities pane groups entities by facet and retains Outline and Ideas tabs. Bulk add accepts up to 500 entities per batch, previews changes before applying them, and uses one undo transaction. Matching names (case insensitive) with identical facet sets are skipped; different facet sets remain distinct entities.

Facet groups are editable folders, with nested folders, names, colors, and icons. Drag rows to organize; drop markers distinguish reorder from nesting. Removing a folder retains its contents. Search exposes matches inside collapsed containers. Click to inspect, double-click to read a summary, and use the summary's edit/write/explore actions. Info buttons and keyboard shortcuts expose the same actions without double-clicking. Outline edges reorder; centers nest, independently of story chronology.
