const tabsEl=document.getElementById("tabs"),welcome=document.getElementById("welcome"),webArea=document.getElementById("webArea"),address=document.getElementById("address"),progress=document.getElementById("progress");
const aiPanel=document.getElementById("aiPanel"),messages=document.getElementById("messages"),aiInput=document.getElementById("aiInput"),aiState=document.getElementById("aiState");
let tabs=[],activeId=null,nextId=1;

function isUrl(s){return /^(https?:\/\/|file:\/\/|about:|localhost:)/i.test(s)||/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)}
function normalize(s){s=s.trim();if(!s)return "nova://home";return isUrl(s)?(/^https?:\/\//i.test(s)?s:"https://"+s):"https://www.google.com/search?q="+encodeURIComponent(s)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function active(){return tabs.find(t=>t.id===activeId)}
function renderTabs(){tabsEl.innerHTML="";tabs.forEach(t=>{const e=document.createElement("div");e.className="tab"+(t.id===activeId?" active":"");e.innerHTML=`<span>${esc(t.title)}</span><button>×</button>`;e.onclick=x=>x.target.tagName==="BUTTON"?closeTab(t.id):switchTab(t.id);tabsEl.appendChild(e)})}
function createTab(){const t={id:nextId++,url:"nova://home",title:"New Tab",view:null};tabs.push(t);switchTab(t.id)}
function switchTab(id){activeId=id;const t=active();if(!t)return;tabs.forEach(x=>{if(x.view)x.view.style.display=x.id===id?"flex":"none"});welcome.style.display=t.view?"none":"flex";webArea.style.display=t.view?"block":"none";address.value=t.view?t.url:"";renderTabs()}
function closeTab(id){const i=tabs.findIndex(t=>t.id===id);if(i<0)return;if(tabs[i].view)tabs[i].view.remove();const was=id===activeId;tabs.splice(i,1);if(!tabs.length)return createTab();if(was)switchTab(tabs[Math.max(0,i-1)].id);else renderTabs()}
function navigate(t,raw){const url=normalize(raw);t.url=url;t.title=(()=>{try{return new URL(url).hostname.replace(/^www\./,"")}catch{return"New Tab"}})();if(!t.view){t.view=document.createElement("webview");t.view.setAttribute("allowpopups","");t.view.setAttribute("partition","persist:nova");t.view.src=url;t.view.addEventListener("did-start-loading",()=>progress.style.width="40%");t.view.addEventListener("did-stop-loading",()=>{progress.style.width="100%";setTimeout(()=>progress.style.width="0",200);sync(t)});t.view.addEventListener("did-navigate",()=>sync(t));t.view.addEventListener("did-navigate-in-page",()=>sync(t));t.view.addEventListener("page-title-updated",e=>{t.title=e.title||t.title;renderTabs()});webArea.appendChild(t.view)}else t.view.loadURL(url);switchTab(t.id)}
function sync(t){try{t.url=t.view.getURL();t.title=t.view.getTitle()||t.title;if(t.id===activeId)address.value=t.url;renderTabs()}catch{}}

function toggleAI(){aiPanel.classList.toggle("open");if(aiPanel.classList.contains("open"))aiInput.focus()}
function addMsg(who,text){const b=document.createElement("div");b.className="bubble "+(who==="Nova"?"nova":"user");b.innerHTML=`<b>${who}</b><p>${esc(text)}</p>`;messages.appendChild(b);messages.scrollTop=messages.scrollHeight}
function settings(){document.getElementById("speakReplies").checked=localStorage.getItem("novaSpeak")==="true";document.getElementById("endpoint").value=localStorage.getItem("novaEndpoint")||"";document.getElementById("model").value=localStorage.getItem("novaModel")||"";document.getElementById("apiKey").value=localStorage.getItem("novaKey")||"";document.getElementById("settings").classList.add("open")}
async function currentPageText(){const t=active();if(!t?.view)return "";try{return await t.view.executeJavaScript(`document.body ? document.body.innerText.slice(0,20000) : ""`)}catch{return""}}
async function ask(text){text=text.trim();if(!text)return;addMsg("You",text);aiInput.value="";aiState.textContent="Thinking…";let page="";if(/page|website|site|this/i.test(text))page=await currentPageText();const endpoint=localStorage.getItem("novaEndpoint");const model=localStorage.getItem("novaModel");const key=localStorage.getItem("novaKey");const system=`You are Nova AI, an assistant built into a desktop browser. Be helpful, concise, and honest. You can analyze browser page text when provided. Do not claim to have performed actions you did not perform.${page?`\n\nCURRENT PAGE TEXT:\n${page}`:""}`;try{const answer=await window.nova.askAI({endpoint,apiKey:key,model,messages:[{role:"system",content:system},{role:"user",content:text}]});addMsg("Nova",answer)}catch(e){addMsg("Nova",`I need an AI connection first. Open ⚙ and add an OpenAI-compatible endpoint, or use a local AI server.\n\nError: ${e.message}`)}aiState.textContent="Ready"}

document.getElementById("newTab").onclick=createTab;
document.getElementById("back").onclick=()=>{const t=active();if(t?.view?.canGoBack())t.view.goBack()};
document.getElementById("forward").onclick=()=>{const t=active();if(t?.view?.canGoForward())t.view.goForward()};
document.getElementById("reload").onclick=()=>active()?.view?.reload();
document.getElementById("home").onclick=()=>{const t=active();if(t?.view){t.view.remove();t.view=null;t.url="nova://home";t.title="New Tab"}switchTab(t.id)};
document.getElementById("aiToggle").onclick=toggleAI;
document.getElementById("closeAI").onclick=toggleAI;
document.getElementById("settingsBtn").onclick=settings;
document.getElementById("settingsClose").onclick=()=>document.getElementById("settings").classList.remove("open");
document.getElementById("saveSettings").onclick=()=>{localStorage.setItem("novaSpeak",document.getElementById("speakReplies").checked);localStorage.setItem("novaEndpoint",document.getElementById("endpoint").value.trim());localStorage.setItem("novaModel",document.getElementById("model").value.trim());localStorage.setItem("novaKey",document.getElementById("apiKey").value);document.getElementById("settings").classList.remove("open");aiState.textContent="Settings saved"};
document.getElementById("addressForm").onsubmit=e=>{e.preventDefault();const t=active();if(t)navigate(t,address.value)};
document.getElementById("heroForm").onsubmit=e=>{e.preventDefault();const v=document.getElementById("heroInput").value;if(/page|summarize|explain/i.test(v))toggleAI(),ask(v);else navigate(active(),v)};
document.getElementById("aiForm").onsubmit=e=>{e.preventDefault();ask(aiInput.value)};
document.querySelectorAll("[data-ai]").forEach(b=>b.onclick=()=>ask(b.dataset.ai));
document.querySelectorAll("[data-prompt]").forEach(b=>b.onclick=()=>{toggleAI();ask(b.dataset.prompt)});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="l"){e.preventDefault();address.focus();address.select()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="t"){e.preventDefault();createTab()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="w"){e.preventDefault();closeTab(activeId)}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="j"){e.preventDefault();toggleAI()}});
createTab();
