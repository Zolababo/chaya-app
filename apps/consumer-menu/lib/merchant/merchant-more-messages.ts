export function merchantMoreFlashMessage(
  section: "store" | "hours" | "export",
  code: string | undefined,
): { kind: "error" | "ok"; text: string } | null {
  if (!code) return null;

  if (code === "forbidden") {
    return { kind: "error", text: "이 작업을 할 권한이 없습니다." };
  }
  if (code === "no_service" || code === "db") {
    return { kind: "error", text: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (section === "store" && code === "saved") {
    return { kind: "ok", text: "매장 설정을 저장했습니다." };
  }
  if (section === "store" && code === "logo_upload") {
    return {
      kind: "error",
      text: "로고 업로드에 실패했습니다. 갤러리·카메라 사진은 자동 변환 후 다시 시도해 주세요.",
    };
  }
  if (section === "hours") {
    if (code === "saved") return { kind: "ok", text: "영업 설정을 저장했습니다." };
    if (code === "open") return { kind: "ok", text: "영업을 시작했습니다. 손님 주문을 받습니다." };
    if (code === "closed") return { kind: "ok", text: "주문 접수를 마감했습니다." };
  }

  return null;
}
