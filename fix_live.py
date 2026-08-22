import re
import json

path = "src/htmlContent.ts"
content = open(path, encoding="utf-8").read()

m = re.search(r'=\s*(".*");\s*$', content, re.S)
assert m, "تعذر قراءة HTML"

html = json.loads(m.group(1))

start = html.find("function watchLive(){")
assert start != -1, "لم يتم العثور على watchLive"

end = html.find("/* ===== سينما ===== */", start)
assert end != -1, "لم يتم العثور على نهاية watchLive"

new = """function watchLive(){
  if(!liveFrom){
    toast('لا يوجد بث متاح حالياً');
    return;
  }

  toast('جاري الاتصال بالبث...');

  const c=peer.call(liveFrom,null,{metadata:{kind:'live',name:myName}});

  if(!c){
    toast('تعذر بدء الاتصال');
    return;
  }

  let got=false;

  c.on('stream',s=>{
    got=true;
    $('#remVid').srcObject=s;
    $('#remVid').style.display='block';
    toast('متصل بالبث');
  });

  c.on('error',e=>{
    toast('خطأ بالبث: '+(e.type||e.name||'')+' - '+(e.message||''));
  });

  c.on('close',()=>{
    toast('انتهى أو انقطع البث');
  });

  setTimeout(()=>{
    if(!got){
      toast('لم يصل فيديو خلال 8 ثواني');
    }
  },8000);
}

"""

html = html[:start] + new + html[end:]

encoded = json.dumps(html, ensure_ascii=False)

open(path, "w", encoding="utf-8").write(
    "export const RABAHDJ_HTML = " + encoded + ";\n"
)

print("تم تعديل watchLive بنجاح")
