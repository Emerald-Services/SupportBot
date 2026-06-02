/** Curated Google Fonts for transcript HTML (keep in sync with dashboard/src/lib/google-fonts.ts). */

const SYSTEM_FALLBACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const GOOGLE_FONTS = [
  { id: "Inter", label: "Inter" },
  { id: "Roboto", label: "Roboto" },
  { id: "Open Sans", label: "Open Sans" },
  { id: "Lato", label: "Lato" },
  { id: "Montserrat", label: "Montserrat" },
  { id: "Poppins", label: "Poppins" },
  { id: "Nunito", label: "Nunito" },
  { id: "Raleway", label: "Raleway" },
  { id: "Work Sans", label: "Work Sans" },
  { id: "Source Sans 3", label: "Source Sans 3" },
  { id: "DM Sans", label: "DM Sans" },
  { id: "Manrope", label: "Manrope" },
  { id: "Outfit", label: "Outfit" },
  { id: "Rubik", label: "Rubik" },
  { id: "Ubuntu", label: "Ubuntu" },
  { id: "Fira Sans", label: "Fira Sans" },
  { id: "PT Sans", label: "PT Sans" },
  { id: "Noto Sans", label: "Noto Sans" },
  { id: "Oswald", label: "Oswald" },
  { id: "Merriweather", label: "Merriweather" },
  { id: "Playfair Display", label: "Playfair Display" },
  { id: "Libre Baskerville", label: "Libre Baskerville" },
  { id: "JetBrains Mono", label: "JetBrains Mono" },
  { id: "Fira Code", label: "Fira Code" },
];

const GOOGLE_FONT_IDS = new Set(GOOGLE_FONTS.map((f) => f.id));

function normalizeFontFamily(fontFamily) {
  if (!fontFamily || typeof fontFamily !== "string") return "Inter";
  const trimmed = fontFamily.trim();
  if (trimmed === "system") return "system";
  if (!trimmed.includes(",")) {
    return GOOGLE_FONT_IDS.has(trimmed) ? trimmed : "Inter";
  }
  const match = trimmed.match(/^["']?([^"',]+)["']?/);
  const first = match?.[1]?.trim();
  if (first && GOOGLE_FONT_IDS.has(first)) return first;
  return "Inter";
}

function googleFontsCssUrl(familyIds) {
  const families = familyIds
    .map((id) => {
      const encoded = encodeURIComponent(id).replace(/%20/g, "+");
      return `family=${encoded}:wght@400;600;700;800`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function resolveTypography(fontFamily) {
  const id = normalizeFontFamily(fontFamily);

  if (id === "system") {
    return {
      fontId: "system",
      fontFamilyCss: SYSTEM_FALLBACK,
      headLinks: "",
    };
  }

  const url = googleFontsCssUrl([id]);
  return {
    fontId: id,
    fontFamilyCss: `"${id}", ${SYSTEM_FALLBACK}`,
    headLinks: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${url}" rel="stylesheet">`,
  };
}

module.exports = {
  GOOGLE_FONTS,
  GOOGLE_FONT_IDS,
  SYSTEM_FALLBACK,
  normalizeFontFamily,
  googleFontsCssUrl,
  resolveTypography,
};
