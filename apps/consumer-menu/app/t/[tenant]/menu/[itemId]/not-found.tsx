import Link from "next/link";

export default function MenuItemNotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-bold">메뉴를 찾을 수 없습니다</h1>
      <p className="text-sm text-chaya-muted dark:text-zinc-400">
        주소가 잘못되었거나 삭제된 메뉴일 수 있습니다.
      </p>
      <p>
        <Link href="../.." className="font-semibold text-chaya-primary underline dark:text-orange-400">
          메뉴 목록으로
        </Link>
      </p>
    </div>
  );
}
