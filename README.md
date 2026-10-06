# Save Your Partner — Fortress V7.2

This V7 package keeps the V6 game experience and fixes the Question Vault/stage ordering.

## Run

1. Install Node.js LTS.
2. Double-click `RUN_V7_2.cmd`, or from this folder run:

```powershell
npm install
npm run install:all
npm run dev
```

Open `http://localhost:5173`.

Admin: `http://localhost:5173/admin`
Password: `Aditya12`

## Question order

Each of the 6 groups has 20 questions. The selected group's questions are used in this exact order:

- Stage 1: Q1
- Stage 2: Q2–Q3
- Stage 3: Q4–Q6
- Stage 4: Q7–Q11
- Stage 5: Q12–Q20

## Question Vault

Admin can edit question text, type, code, expected answer/fix and hint. Save is persisted to the server's data store and the UI confirms server synchronization.

## Audio

The game includes locally generated Indian-inspired instrumental ambience (drone, plucked/sitar-like tones, tabla-like percussion and darker horror ambience). Browsers require a user interaction before audible audio can start, so the first click/key interaction starts the music. Intensity changes with stage and recent solving pace.


## Question Vault V7.2
The Question Vault is deliberately separated into VIEW and EDIT modes. Selecting a question does not start editing. Selecting Q2/Q3/etc. stays on that question and does not auto-refresh back to Q1. The vault does not auto-refresh every few seconds; use the REFRESH button when you want fresh server data. Save Question writes only the currently selected question. Cancel discards unsaved edits.

Stage order for every selected group: Q1; Q2-Q3; Q4-Q6; Q7-Q11; Q12-Q20.
