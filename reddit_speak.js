
const dic = [ ["Quote" , "引用" ] ,
            ["Strike-line","打ち消し"],
            ["Strike-line end","打ち消し終わり"],
            ["Headline","見出し"] ];

const dic_lang = {
    "en-US":0 ,
    "en-GB":0 ,
    "ja-JP":1 ,
}

function tr( word , lang){
    var index= dic_lang[ lang ];
    if(index == null) index = 0;
    var trans = dic.find( d => d[0] == word)[ index ];
    if(trans == null) trans = word;
    return trans;
}

function readable(string,lang){
    var norm = string.
        replace( /^&gt;/mg , `${tr("Quote",lang)}: `).
        replace( /~~([^~]+)~~/g ,
                 `${tr("Strike-line",lang)} $1 ${tr("Strike-line end",lang)}`).
        replace( /\[([^\[\]]+)\]\(.*?\)/g , "$1(link)").
        replace( /^\#+/mg , `${tr("Headline",lang)}: `).
        replace( /^\s*\* /mg , "").
        replace(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/g,"[url]").
        replace(/^    .*$/mg , "")
        
    return norm;
}

function mes(string){
    var breaked = string.replace(/\n/g,"<br>\n");
    // document.getElementById("message").textContent = string;
    document.getElementById("message").innerHTML = breaked;
}

var w; // = new CommentWatcher("newsokur");
var running = false;

function load(){
    console.log("load()");
    
    document.getElementById("speed").addEventListener('input',()=>{
        document.getElementById("speed-disp").innerHTML = document.getElementById("speed").value;
    });
    
    if ("speechSynthesis" in window) {
        var vs = window.speechSynthesis.getVoices();
        if(vs.length < 1){
            /*
            window.speechSynthesis.onvoiceschanged = ()=>{
                load2();
            }
            */
            mes("準備中…");
            setTimeout(load2 , 2000);
        }else{
            load2();
        }
    }else{
        mes("このブラウザは対応していないようです。")
    }
}

function load2(){
    console.log("load2()");
    var voices = window.speechSynthesis.getVoices();
    var voice_local = voices.filter( v => !(v.name.match(/^Google/)) );
    if( voice_local.length > 0 ){
        document.getElementById("start-button").disabled = false;
        document.getElementById("stop-button").disabled = true;
        document.getElementById("subreddit").disabled = true;
        mes("OK");
    } else {
        mes("利用できる音声合成が無いようです。なおGoogle WEB APIは、自動読み上げに制限があるため、このツールでは利用できません。ローカルな読み上げ機能のあるOS上で試してみてください。")

    }
}

function stop(){
    running = false;
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
    document.getElementById("start-button").disabled = false;
    document.getElementById("stop-button").disabled = true;
    document.getElementById("subreddit").disabled = false;

    mes("停止");
}

function start(){
    document.getElementById("start-button").disabled = true;
    document.getElementById("stop-button").disabled = false;
    document.getElementById("subreddit").disabled = true;

    running = true;
    var sub = document.getElementById("subreddit").value;
    w = new CommentWatcher(sub);
    
    var synth = window.speechSynthesis;
    const queue = [];
    
    var voices = synth.getVoices();

    if(voices.length > 0){

        // .localServiceなvoiceを選ぶべきかもしれない
        var voice = voices.find( v => {
            return (v.lang.match(/ja-JP/) || v.localService == true)
        });
        /*
        if(voice == null){
            var voice = voices.find(v => {
                return (v.lang.match(/ja-JP/) );
            });
            if( voice != null){
                console.log("リモート音声を使います");
                document.getElementById("message").textContent = "リモート";
            }
        }
        */
        if(voice == null){
            voice = voices[0];
        }
        console.log(voice.name);
        synth.resume();
        
        function loop(){

            if( running && !synth.pending && !synth.speaking){
                if( queue.length > 0){
                    var text = queue.pop();
                    mes(text);
                    // utter.voice = voice;
                    //utter.lang = "ja-JP";
                    var lang = document.getElementById("form").lang.value;
                    console.log("selected lang:" + lang );
                    var utter = new SpeechSynthesisUtterance(readable(text,lang));
                    utter.lang = lang;
                    utter.rate = document.getElementById("speed").value;
                    utter.onerror = (e)=>{ console.log(`on error ${e.error}`); };
                    synth.speak(utter);
                }else
                    mes("(新着待ち…)");
            }

            if(running && (queue.length < 5) ){
                w.get( ret =>{
                    // ここでqueueにセットする
                    var takenum = 25 - queue.length;
                    if(takenum < 0) takenum = 0;
                    var ret2 = ret.slice(0,takenum);
                    ret2.reverse().forEach((e)=>{
                        queue.unshift(e);
                    });
                });
            }
            
            if(running)
                setTimeout(loop,1000);
        }
        loop();
    }
}

