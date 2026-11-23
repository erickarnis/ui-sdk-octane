# Core optimization log

Each line: change, bench label, what moved (octane median ms, react median ms in the same run).

- core-before (64bbe28, 30 runs): tabs mount 81.4/73.0, tabs select 28.4/20.2, switches mount 76.7/57.6, switches toggle 32.3/25.7, popover mount 32.7/16.3, popover open 7.3/6.4, select open 22.5/20.1, select close 13.3/15.3, combobox type 9.0/9.4.

Method from here: `pnpm bench` medians move ±20% between sessions, so each change is also measured A/B (scratchpad tools/ab.mjs: two Octane builds, the base commit and the change, alternating run by run in one browser; B/A is the median of per-run ratios; "js" is the in-page synchronous time of `act`, or ScriptDuration for click scenarios). An A/A run put the noise of the paired ratio at about ±4%.

- c1 read once (attrs, presence and part read once per render, props merged into one object): B/A js tabs mount 0.96, tabs select 0.87, switches mount 0.96, switches toggle 0.93, popover mount 0.96, open 0.99. Renders and mutations unchanged. Kept.
