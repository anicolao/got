# E2E Strategy

Playwright tests follow the `food` project pattern:

- every visible state is asserted through `TestStepHelper` before screenshots are captured
- screenshots use zero pixel tolerance through `toHaveScreenshot.maxDiffPixels = 0`
- each walkthrough spec regenerates a sibling `README.md` from its validated steps
- mobile is the primary viewport because the moderator and players use phones during play
