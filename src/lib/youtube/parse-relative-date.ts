export function parseRelativeYouTubeDate(label: string): string {
  const now = new Date();
  const match = label.trim().match(/(\d+)\s*(mo|mos|month|months|d|day|days|w|week|weeks|y|yr|year|years)\s+ago/i);

  if (!match) {
    return now.toISOString();
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("mo") || unit.startsWith("month")) {
    now.setMonth(now.getMonth() - amount);
  } else if (unit.startsWith("d")) {
    now.setDate(now.getDate() - amount);
  } else if (unit.startsWith("w")) {
    now.setDate(now.getDate() - amount * 7);
  } else if (unit.startsWith("y")) {
    now.setFullYear(now.getFullYear() - amount);
  }

  return now.toISOString();
}
