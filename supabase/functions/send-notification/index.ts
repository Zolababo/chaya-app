<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>N개 영상 전환 데모</title>
<style>
  body {
    margin: 0; background: #000;
    display: flex; justify-content: center; align-items: center;
    height: 100vh;
  }
  #stage {
    position: relative;
    width: 80%; max-width: 900px; aspect-ratio: 16/9;
    background: #111; overflow: hidden;
  }
  video {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: contain;
  }
  .hidden { display: none; }

  /* PIP 작은 화면 */
  #pip {
    position: absolute; right: 20px; bottom: 20px;
    width: 25%; aspect-ratio: 16/9;
    border: 2px solid #fff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.7);
    background: #000;
    z-index: 10;
  }
</style>
</head>
<body>
  <div id="stage">
    <!-- 여러 영상 준비 -->
    <video src="video1.mp4"></video>
    <video src="video2.mp4" class="hidden"></video>
    <video src="video3.mp4" class="hidden"></video>
    <div id="pip" class="hidden"></div>
  </div>

<script>
const stage = document.getElementById("stage");
const videos = stage.querySelectorAll("video");
const pipBox = document.getElementById("pip");

let current = 0;
videos[current].play();

// 현재 영상만 오디오 켜기
function updateAudio(){
  videos.forEach((v,i)=> v.muted = (i !== current));
}

// 다음 인덱스
function nextIndex(){ return (current+1) % videos.length; }

// PIP 표시
function showPip(){
  const n = nextIndex();
  pipBox.innerHTML = "";
  const pipVid = document.createElement("video");
  pipVid.src = videos[n].src;
  pipVid.muted = true;
  pipVid.autoplay = true;
  pipVid.loop = true;
  pipBox.appendChild(pipVid);
  pipBox.classList.remove("hidden");
}

// PIP 숨기기
function hidePip(){
  pipBox.classList.add("hidden");
  pipBox.innerHTML = "";
}

// 전환
function switchToNext(){
  videos[current].classList.add("hidden");
  videos[current].pause();
  current = nextIndex();
  videos[current].classList.remove("hidden");
  videos[current].play();
  updateAudio();
}

// 일반 화면: 누르면 PIP, 떼면 원복, 클릭하면 전환
stage.addEventListener("mousedown", e=>{
  if(document.fullscreenElement) return;
  showPip();
});
stage.addEventListener("mouseup", e=>{
  if(document.fullscreenElement) return;
  hidePip();
});
stage.addEventListener("click", e=>{
  if(document.fullscreenElement) return;
  switchToNext();
});

// 전체화면: 클릭하면 다음 영상으로 전환
stage.addEventListener("click", e=>{
  if(document.fullscreenElement){
    switchToNext();
  }
});

// 초기 오디오 세팅
updateAudio();
</script>
</body>
</html>
