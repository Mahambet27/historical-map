export const RELEASE_CHANNELS = Object.freeze([
  "development",
  "preview",
  "exhibition-rc",
  "exhibition-stable",
]);

const requestedChannel = String(
  import.meta.env.VITE_RELEASE_CHANNEL || "development"
).toLowerCase();

export const RELEASE_CHANNEL = RELEASE_CHANNELS.includes(requestedChannel)
  ? requestedChannel
  : "development";

export const OFFLINE_EXHIBITION =
  String(import.meta.env.VITE_OFFLINE_EXHIBITION || "").toLowerCase() ===
  "true";

export const isExhibitionReleaseChannel = (channel = RELEASE_CHANNEL) =>
  channel === "exhibition-rc" || channel === "exhibition-stable";

export const resolveReleaseRepositoryMode = ({
  offline = OFFLINE_EXHIBITION,
  channel = RELEASE_CHANNEL,
  requested = "auto",
} = {}) => {
  if (offline) return "local";
  if (isExhibitionReleaseChannel(channel)) {
    return requested === "local" ? "local" : "auto";
  }
  return ["local", "supabase", "auto"].includes(requested)
    ? requested
    : "auto";
};

export const getReleaseChannelPolicy = (
  channel = RELEASE_CHANNEL,
  { offline = OFFLINE_EXHIBITION } = {}
) => {
  const locked = isExhibitionReleaseChannel(channel);
  return Object.freeze({
    channel,
    defaultOfficialDemo: locked,
    showDebugControls: !locked,
    showScientificReview: !locked,
    showDiagnosticsInMainUi: !locked,
    allowConsoleDebug: !locked,
    repositoryMode: resolveReleaseRepositoryMode({ offline, channel }),
    modernMapboxGeographyAllowed: false,
  });
};

export const RELEASE_CHANNEL_POLICY = getReleaseChannelPolicy();
