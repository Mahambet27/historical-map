# P2A.8 demo links

Production placeholder: `https://<production-domain>`

- Main: `https://<production-domain>/demo`
- Russian: `https://<production-domain>/demo?lang=ru`
- Kazakh: `https://<production-domain>/demo?lang=kk`
- English: `https://<production-domain>/demo?lang=en`
- Light: `https://<production-domain>/demo?quality=light`
- Recording: `https://<production-domain>/demo?recording=true`
- Operator diagnostics: `https://<production-domain>/demo/diagnostics`
- Recovery: `https://<production-domain>/demo?recovery=true`
- Projector: `https://<production-domain>/demo?projector=true`

## Stable QR workflow

After the production origin is approved:

`npm run exhibition:qr -- --url=https://production-domain/demo`

The command accepts only HTTPS production `/demo`, rejects credentials and
localhost, and targets `demo.png`, `demo-light.png`, `demo-kk.png`, and
`demo-ru.png` under `release-packages/stable/qr/`. If the optional lightweight
`qrcode` package is unavailable, the command creates a README placeholder only;
do not publish that placeholder as a QR code.

QR не создаются до получения реального production domain. QR с localhost
запрещены.
