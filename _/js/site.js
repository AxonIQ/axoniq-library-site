(()=>{var e,o,r,s=/^sect(\d)$/,i=document.querySelector(".nav-container"),a=document.querySelector(".nav-toggle"),c=i.querySelector(".nav"),l=(a.addEventListener("click",function(e){if(a.classList.contains("is-active"))return u(e);v(e);var e=document.documentElement,t=(e.classList.add("is-clipped--nav"),a.classList.add("is-active"),i.classList.add("is-active"),c.getBoundingClientRect()),n=window.innerHeight-Math.round(t.top);Math.round(t.height)!==n&&(c.style.height=n+"px");e.addEventListener("click",u)}),i.addEventListener("click",v),i.querySelector("[data-panel=menu]"));function t(){var e,t,n=window.location.hash;if(n&&(n.indexOf("%")&&(n=decodeURIComponent(n)),!(e=l.querySelector('.nav-link[href="'+n+'"]')))){n=document.getElementById(n.slice(1));if(n)for(var i=n,a=document.querySelector("article.doc");(i=i.parentNode)&&i!==a;){var c=i.id;if((c=c||(c=s.test(i.className))&&(i.firstElementChild||{}).id)&&(e=l.querySelector('.nav-link[href="#'+c+'"]')))break}}if(e)t=e.parentNode;else{if(!r)return;e=(t=r).querySelector(".nav-link")}t!==o&&(h(l,".nav-item.is-active").forEach(function(e){e.classList.remove("is-active","is-current-path","is-current-page")}),t.classList.add("is-current-page"),d(o=t),p(l,e))}function d(e){for(var t,n=e.parentNode;!(t=n.classList).contains("nav-menu");)"LI"===n.tagName&&t.contains("nav-item")&&t.add("is-active","is-current-path"),n=n.parentNode;e.classList.add("is-active")}function n(){var e,t,n,i;this.classList.toggle("is-active")&&(e=parseFloat(window.getComputedStyle(this).marginTop),t=this.getBoundingClientRect(),n=l.getBoundingClientRect(),0<(i=(t.bottom-n.top-n.height+e).toFixed()))&&(l.scrollTop+=Math.min((t.top-n.top-e).toFixed(),i))}function u(e){v(e);e=document.documentElement;e.classList.remove("is-clipped--nav"),a.classList.remove("is-active"),i.classList.remove("is-active"),e.removeEventListener("click",u)}function v(e){e.stopPropagation()}function p(e,t){var n=e.getBoundingClientRect(),i=n.height,a=window.getComputedStyle(c);"sticky"===a.position&&(i-=n.top-parseFloat(a.top)),e.scrollTop=Math.max(0,.5*(t.getBoundingClientRect().height-i)+t.offsetTop)}function h(e,t){return[].slice.call(e.querySelectorAll(t))}l&&(e=i.querySelector("[data-panel=explore]"),o=l.querySelector(".is-current-page"),(r=o)?(d(o),p(l,o.querySelector(".nav-link"))):l.scrollTop=0,h(l,".nav-item-toggle").forEach(function(e){var t=e.parentElement,e=(e.addEventListener("click",n.bind(t)),((e,t)=>(!(e=e.nextElementSibling)||!t||e[e.matches?"matches":"msMatchesSelector"](t))&&e)(e,".nav-text"));e&&(e.style.cursor="pointer",e.addEventListener("click",n.bind(t)))}),e&&e.querySelector(".context").addEventListener("click",function(){h(c,"[data-panel]").forEach(function(e){e.classList.toggle("is-active")})}),l.addEventListener("mousedown",function(e){1<e.detail&&e.preventDefault()}),l.querySelector('.nav-link[href^="#"]'))&&(window.location.hash&&t(),window.addEventListener("hashchange",t))})();
(()=>{if(f=document.querySelector("aside.toc.sidebar")){if(document.querySelector("body.-toc"))return f.parentNode.removeChild(f);var e=parseInt(f.dataset.levels||2,10);if(!(e<0)){for(var t="article.doc",d=document.querySelector(t),o=[],n=0;n<=e;n++){var i=[t];if(n){for(var r=1;r<=n;r++)i.push((2===r?".sectionbody>":"")+".sect"+r);i.push("h"+(n+1)+"[id]")}else i.push("h1[id].sect0");o.push(i.join(">"))}m=o.join(","),u=d.parentNode;var a,c=[].slice.call((u||document).querySelectorAll(m));if(!c.length)return f.parentNode.removeChild(f);var s={},l=c.reduce(function(e,t){var o=document.createElement("a"),n=(o.textContent=t.textContent,s[o.href="#"+t.id]=o,document.createElement("li"));return n.dataset.level=parseInt(t.nodeName.slice(1),10)-1,n.appendChild(o),e.appendChild(n),e},document.createElement("ul")),u=f.querySelector(".toc-menu"),m=(u||((u=document.createElement("div")).className="toc-menu"),document.createElement("h3")),f=(m.textContent=f.dataset.title||"Contents",u.appendChild(m),u.appendChild(l),!document.getElementById("toc")&&d.querySelector("h1.page ~ :not(.is-before-toc)"));f&&((m=document.createElement("aside")).className="toc embedded",m.appendChild(u.cloneNode(!0)),f.parentNode.insertBefore(m,f)),window.addEventListener("load",function(){p(),window.addEventListener("scroll",p)})}}function p(){var n,i,t,e=window.pageYOffset,o=1.15*h(document.documentElement,"fontSize"),r=d.offsetTop;e&&window.innerHeight+e+2>=document.documentElement.scrollHeight?(a=Array.isArray(a)?a:Array(a||0),n=[],i=c.length-1,c.forEach(function(e,t){var o="#"+e.id;t===i||e.getBoundingClientRect().top+h(e,"paddingTop")>r?(n.push(o),a.indexOf(o)<0&&s[o].classList.add("is-active")):~a.indexOf(o)&&s[a.shift()].classList.remove("is-active")}),l.scrollTop=l.scrollHeight-l.offsetHeight,a=1<n.length?n:n[0]):(Array.isArray(a)&&(a.forEach(function(e){s[e].classList.remove("is-active")}),a=void 0),c.some(function(e){if(e.getBoundingClientRect().top+h(e,"paddingTop")-o>r)return!0;t="#"+e.id}),t?t!==a&&(a&&s[a].classList.remove("is-active"),(e=s[t]).classList.add("is-active"),l.scrollHeight>l.offsetHeight&&(l.scrollTop=Math.max(0,e.offsetTop+e.offsetHeight-l.offsetHeight)),a=t):a&&(s[a].classList.remove("is-active"),a=void 0))}function h(e,t){return parseFloat(window.getComputedStyle(e)[t])}})();
(()=>{var n,o,c;function i(e){return e&&(~e.indexOf("%")?decodeURIComponent(e):e).slice(1)}function r(e){if(e){if(e.altKey||e.ctrlKey)return;window.location.hash="#"+this.id,e.preventDefault()}var t=function e(t,o){return n.contains(t)?e(t.offsetParent,t.offsetTop+o):o}(this,0)-o.getBoundingClientRect().bottom;!1===e&&c?window.scrollTo({left:0,top:t,behavior:"instant"}):window.scrollTo(0,t)}document.getElementsByTagName("redoc")||(n=document.querySelector("article.doc"),o=document.querySelector(".toolbar"),c="scrollTo"in document.documentElement,window.addEventListener("load",function e(t){var o;(o=i(window.location.hash))&&(o=document.getElementById(o))&&(r.call(o,!1),setTimeout(r.bind(o,!1),250)),window.removeEventListener("load",e)}),Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function(e){var t;(t=i(e.hash))&&(t=document.getElementById(t))&&e.addEventListener("click",r.bind(t))}))})();
(()=>{var o,e=document.querySelector(".page-versions .version-menu-toggle");e&&(o=document.querySelector(".page-versions"),e.addEventListener("click",function(e){var t=document.querySelectorAll(".toolbar .is-active");o.classList.toggle("is-active"),t.forEach(e=>{e.classList.remove("is-active")}),e.stopPropagation()}),document.documentElement.addEventListener("click",function(){o.classList.remove("is-active")}))})();
(()=>{var t=document.querySelector(".navbar-burger");t&&t.addEventListener("click",function(t){t.stopPropagation(),document.documentElement.classList.toggle("is-clipped--navbar"),this.classList.toggle("is-active");t=document.getElementById(this.dataset.target);{var e;t.classList.toggle("is-active")&&(t.style.maxHeight="",e=window.innerHeight-Math.round(t.getBoundingClientRect().top),parseInt(window.getComputedStyle(t).maxHeight,10)!==e)&&(t.style.maxHeight=e+"px")}}.bind(t))})();
(()=>{var o=/^\$ (\S[^\\\n]*(\\\n(?!\$ )[^\\\n]*)*)(?=\n|$)/gm,s=/( ) *\\\n *|\\\n( ?) */g,l=/ +$/gm,e=(document.getElementById("site-script")||{dataset:{}}).dataset,d=null==e.uiRootPath?".":e.uiRootPath,r=e.svgAs,p=window.navigator.clipboard;[].slice.call(document.querySelectorAll(".doc pre.highlight, .doc .literalblock pre")).forEach(function(e){var t,a,n,c;if(e.classList.contains("highlight"))(i=(t=e.querySelector("code")).dataset.lang)&&"console"!==i&&((n=document.createElement("span")).className="source-lang",n.appendChild(document.createTextNode(i)));else{if(!e.innerText.startsWith("$ "))return;var i=e.parentNode.parentNode;i.classList.remove("literalblock"),i.classList.add("listingblock"),e.classList.add("highlightjs","highlight"),(t=document.createElement("code")).className="language-console hljs",t.dataset.lang="console",t.appendChild(e.firstChild),e.appendChild(t)}(i=document.createElement("div")).className="source-toolbox",n&&i.appendChild(n),p&&((a=document.createElement("button")).className="copy-button",a.setAttribute("title","Copy to clipboard"),"svg"===r?((n=document.createElementNS("http://www.w3.org/2000/svg","svg")).setAttribute("class","copy-icon"),(c=document.createElementNS("http://www.w3.org/2000/svg","use")).setAttribute("href",d+"/img/octicons-16.svg#icon-clippy"),n.appendChild(c),a.appendChild(n)):((c=document.createElement("img")).src=d+"/img/octicons-16.svg#view-clippy",c.alt="copy icon",c.className="copy-icon",a.appendChild(c)),(n=document.createElement("span")).className="copy-toast",n.appendChild(document.createTextNode("Copied!")),a.appendChild(n),i.appendChild(a)),e.parentNode.appendChild(i),a&&a.addEventListener("click",function(e){var t=e.innerText.replace(l,"");"console"===e.dataset.lang&&t.startsWith("$ ")&&(t=(e=>{for(var t,a=[];t=o.exec(e);)a.push(t[1].replace(s,"$1$2"));return a.join(" && ")})(t));window.navigator.clipboard.writeText(t).then(function(){this.classList.add("clicked"),this.offsetHeight,this.classList.remove("clicked")}.bind(this),function(){})}.bind(a,t))})})();