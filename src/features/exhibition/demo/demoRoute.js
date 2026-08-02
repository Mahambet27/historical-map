import {
  RELEASE_CHANNEL_POLICY,
  isExhibitionReleaseChannel,
} from "../../../config/releaseChannel.js";

export const DEMO_LANGUAGES = Object.freeze(["ru", "kk", "en"]);
export const DEMO_QUALITIES = Object.freeze(["auto", "high", "light"]);

export const isDemoPath = (pathname = window.location.pathname) =>
  pathname === "/demo" || pathname.startsWith("/demo/");

export const parseDemoParams = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const language = params.get("lang");
  const quality = params.get("quality");
  return Object.freeze({
    officialDemo: true,
    language: DEMO_LANGUAGES.includes(language) ? language : null,
    quality: DEMO_QUALITIES.includes(quality) ? quality : "auto",
    kiosk: params.get("kiosk") === "true",
    recovery: params.get("recovery") === "true",
    recording: params.get("recording") === "true",
    projector: params.get("projector") === "true",
    forceSvg: params.get("fallback") === "svg",
    mockMapboxFailure:
      import.meta.env.DEV && params.get("mapboxFailure") === "true",
  });
};

export const shouldForceOfficialDemo = ({
  pathname = window.location.pathname,
  channel = RELEASE_CHANNEL_POLICY.channel,
} = {}) => isDemoPath(pathname) || isExhibitionReleaseChannel(channel);
