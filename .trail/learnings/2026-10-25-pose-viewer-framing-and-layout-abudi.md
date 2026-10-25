---
title: Pose viewer framing and layout
author: Abudi
date: 2026-10-25
cost: { minutes: 8, tokens: 48912 }
id: l-2355894a
scope: repo
status: active
src: agent
touches:
  - "web/src/three/poseScene.ts#frame"
  - "web/src/three/poseScene.ts#PoseScene"
  - web/src/three/PoseViewer.tsx
  - web/src/steps/PoseStep.tsx
---

The pose camera used zoomTo on the ligand then zoom(0.7), which crops small drugs to fill the view and cuts off pocket sticks; frame() in poseScene.ts now solves the perspective fit itself (3Dmol's fov is vertical, 20 degrees) so the drug is centred and every atom of the pocket residues (whole residues, not just atoms within 4.5 A) and the crystal ligand fit within FILL, and reset() refits for the plate's current aspect. 3Dmol's viewer.rotate(angle, axis) multiplies on the right, so it turns about the structure's axes, not the screen's: the old TILT and spin wobbled about an arbitrary axis; compose screen turns by premultiplying the view quaternion (screenTurn) and setView. zoomTo is still called once only because it sets the slab and fog depth range. Layout: the step's right column is one Panel that scrolls as a whole (scores, caveat, then Not available yet) because two grid rows let the list overlap the footer at 1024x768; the crystal-position legend item was dropped because its toggle already carries the redock colour and a third key item wrapped the toolbar row.
