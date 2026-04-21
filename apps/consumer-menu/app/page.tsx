import { redirect } from "next/navigation";

/** 로컬 개발 시 기본 테넌트 슬러그로 이동 (QR에서는 /t/{slug} 직접 진입) */
export default function Home() {
  redirect("/t/demo");
}
