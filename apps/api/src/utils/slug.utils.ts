export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function generateUniqueSlug(
  baseText: string,
  checkExistsFn: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(baseText) || "category";
  let candidateSlug = baseSlug;
  let counter = 1;

  while (await checkExistsFn(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug;
}
