# Exhibition guide

## Start

1. Install dependencies with `npm install`.
2. Run `npm run dev`.
3. Open `http://localhost:5173/exhibition`.
4. For an unattended stand, open `/exhibition?kiosk=true`.

Use **Start presentation** for the six-step guided story or **Explore independently** for direct
timeline control. The play button advances every eight seconds; speed can be changed to 1×, 1.5×
or 2×. Back, next, replay and exit controls remain available during the tour.

## Demonstration checks

- Switch KK / RU / EN on the start screen and inside the atlas.
- Select 1465 and open the historical entity card.
- Open **Compare years** to compare 1465 and 1511.
- Open **Academic sources** and follow a source in a new tab.
- Open the local assistant and select “Compare 1465 and 1511”.
- Open **3D**. The local GLB file is used; the viewer web component is loaded only on demand.
- Open accessibility controls and test text scaling, contrast and plain language.

## Offline behavior

Mapbox needs a network connection and a valid public `VITE_MAPBOX_TOKEN`. If either is unavailable,
the application automatically shows the local diagram of Kazakhstan. Timeline, sources, cards,
comparison, lesson and the local assistant continue to work. The guided demonstration never
requires Supabase or an AI API.

## Kiosk preparation

- Use a supported Chromium browser in full-screen mode.
- Disable operating-system sleep and notifications.
- Load the exhibition once with network access so the application shell is cached.
- Keep the device connected to power.
- Confirm speaker/display settings and test 1024×600 plus the native display resolution.
- Touch or press a key during the inactivity warning to continue.
- The kiosk resets after 90 seconds of inactivity; click the Q mark to reset manually.

## Suggested assistant prompts

- Show the formation of the Kazakh Khanate.
- Show the territory under Kasym Khan.
- Compare 1465 and 1511.
- Explain this to a Grade 7 student.
- Show academic sources.
- Start a mini-quiz.
- Go to independent Kazakhstan.
