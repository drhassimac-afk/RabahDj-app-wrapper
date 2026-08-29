const fs = require('fs');
const path = './src/htmlContent.ts';

let content = fs.readFileSync(path, 'utf8');

const startMarker = 'async function switchCamera(){';
const endMarker = 'async function acquireMicWithFallback(){';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('❌ لم يتم العثور على الدالة أو النهاية');
  process.exit(1);
}

const oldFunction = content.substring(startIdx, endIdx);

console.log(
  '📝 الدالة القديمة:',
  oldFunction.substring(0, 120) + '...'
);

const newFunction =
`async function switchCamera(){\\n` +
`  if(!liveStream) return;\\n` +
`  const nextFacing = currentFacing==='user' ? 'environment' : 'user';\\n` +
`  const oldVideoTrack = liveStream.getVideoTracks()[0];\\n` +
`  try{\\n` +
`    let newStream;\\n` +
`    try{\\n` +
`      newStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:nextFacing}});\\n` +
`    }catch(firstError){\\n` +
`      console.warn('فشل بفacingMode، محاولة بدون قيود:',firstError);\\n` +
`      newStream = await navigator.mediaDevices.getUserMedia({video:true});\\n` +
`    }\\n` +
`    const newVideoTrack = newStream.getVideoTracks()[0];\\n` +
`    if(!newVideoTrack) throw new Error('No video track');\\n` +
`    viewerCalls.forEach(call=>{\\n` +
`      const sender = call.peerConnection?.getSenders().find(s=>s.track && s.track.kind==='video');\\n` +
`      if(sender) sender.replaceTrack(newVideoTrack);\\n` +
`    });\\n` +
`    if(activeCall){\\n` +
`      const sender = activeCall.peerConnection?.getSenders().find(s=>s.track && s.track.kind==='video');\\n` +
`      if(sender) sender.replaceTrack(newVideoTrack);\\n` +
`    }\\n` +
`    if(oldVideoTrack){\\n` +
`      liveStream.removeTrack(oldVideoTrack);\\n` +
`      oldVideoTrack.stop();\\n` +
`    }\\n` +
`    liveStream.addTrack(newVideoTrack);\\n` +
`    currentFacing = nextFacing;\\n` +
`    updateLocalVideoMirror();\\n` +
`    const myVid = $('#myVid');\\n` +
`    if(myVid){\\n` +
`      myVid.srcObject = null;\\n` +
`      myVid.srcObject = liveStream;\\n` +
`      myVid.style.display = 'block';\\n` +
`      try{ await myVid.play(); }catch(e){}\\n` +
`    }\\n` +
`    toast('📷 تم تبديل الكاميرا');\\n` +
`  }catch(e){\\n` +
`    console.error('خطأ في تبديل الكاميرا:',e);\\n` +
`    toast('تعذر تبديل الكاميرا: '+(e?.name || e?.message || 'خطأ'));\\n` +
`  }\\n` +
`}\\n`;

content =
  content.substring(0, startIdx) +
  newFunction +
  content.substring(endIdx);

fs.writeFileSync(path, content);

console.log('✅ تم تحديث switchCamera بنجاح');
console.log('📍 الاستبدال:', startIdx, '→', endIdx);

const checkStart = content.indexOf(startMarker);
const checkEnd = content.indexOf(endMarker, checkStart);

if (checkStart === -1 || checkEnd === -1) {
  console.error('❌ فشل التحقق بعد التعديل');
  process.exit(1);
}

console.log('✅ التحقق من حدود الدالة ناجح');
