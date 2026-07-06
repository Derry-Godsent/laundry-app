// ✅ Fixed: Replaced broken import with local type definition
export type BadgeColorScheme = "red" | "orange" | "green" | "blue" | "grey";

const mapColorToStatus = {
  red: ["overdue", "none", "out-of-stock"],
  orange: ["almost-due", "low-stock"],
  green: ["complete", "full", "in-stock"],
  blue: ["pending", "partial"],
  grey: ["cancelled"],
};

export const getColorSchemeByStatus = (status: string): BadgeColorScheme => {
  const found = Object.entries(mapColorToStatus).find(([, val]) =>
    val.includes(status)
  );

  return found ? (found[0] as BadgeColorScheme) : "grey";
};

export const generateDefaultPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};