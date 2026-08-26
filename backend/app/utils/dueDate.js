const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDueDateInput(value) {
  if (value === undefined) {
    return { provided: false };
  }

  if (value === null || value === "") {
    return { provided: true, value: null };
  }

  if (typeof value !== "string" || !DATE_ONLY_REGEX.test(value)) {
    return { provided: true, error: "Due date must be a valid date in YYYY-MM-DD format." };
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { provided: true, error: "Due date must be a valid date in YYYY-MM-DD format." };
  }

  return { provided: true, value };
}
