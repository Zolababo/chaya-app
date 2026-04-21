// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // ---- 안전한 JSON 파싱 ----
  const text = await req.text();
  let data: { record?: any } | null = null; // 타입 힌트 추가

  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    console.error("JSON parse error:", err);
  }

  if (!data) {
    console.log("❌ Invalid or empty JSON body");
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  // ---- 🛠️ 패치 코드: 'record' 데이터를 안전하게 추출하여 TypeError 방지 ----
  const newOrder = data?.record; 

  if (!newOrder) {
    console.log("❌ 주문 데이터(record)가 Body에서 누락되었습니다. (DB는 성공, JS코드에서 데이터 누락)");
    return new Response(JSON.stringify({ message: "No 'record' data found, but request succeeded." }), {
      status: 200, 
      headers: { "Content-Type": "application/json" },
    });
  }
  // ---- 패치 코드 끝 ----

  // ---- 받은 데이터 확인 (수정됨) ----
  console.log("✅ 성공적으로 받은 새로운 주문 데이터:", newOrder);
  
  // (여기에 푸시 알림 전송 로직을 newOrder를 사용해서 추가)

  return new Response(JSON.stringify({
    message: "Notification function executed successfully"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
});
