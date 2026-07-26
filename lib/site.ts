export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://obixconfig.vercel.app";

export const siteHost = siteUrl.replace(/^https?:\/\//, "");
