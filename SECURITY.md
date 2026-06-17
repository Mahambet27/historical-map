# Security

This project uses public frontend environment variables only. Treat all values in `.env` as local
configuration and never commit the file.

## Environment Variables

- Keep `.env` out of Git.
- Commit `.env.example` only with placeholder values.
- Use `VITE_MAPBOX_TOKEN` for a public Mapbox token.
- Never store private API keys in frontend code or Vite `VITE_*` variables.

## Mapbox Token

- Restrict the Mapbox token by allowed domains, such as localhost for development and the production
  deployment domain.
- Rotate the token if it is ever exposed outside the intended environment.

## Frontend Safety

- Avoid `dangerouslySetInnerHTML` unless there is a reviewed, documented need.
- Render external text as normal React text. If HTML is required for a Mapbox popup, escape dynamic
  values before insertion.
- Use HTTPS in production.
- Review dependencies and update them regularly.
