/** Storage 객체 경로 `{folder}/...` 에 쓰는 테넌트 폴더명. 업로드·삭제 로직이 같아야 합니다. */
export function folderSafeTenant(slug: string): string {
  const s = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "tenant";
}
