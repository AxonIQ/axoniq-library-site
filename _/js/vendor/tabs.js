(()=>{var t,r,d;function u(t){var e,a=this.tab,n=this.tabs||(this.tabs=a.closest(".tabs")),s=this.panel||(this.panel=document.getElementById(a.getAttribute("aria-controls")));i(n,".tablist .tab","tab").forEach(function(t){p(t,t===a)}),i(n,".tabpanel","tabpanel").forEach(function(t){y(t,t!==s)}),!this.isSync&&"syncStorageKey"in r&&"syncGroupId"in n.dataset&&(n=r.syncStorageKey+"-"+n.dataset.syncGroupId,window[(r.syncStorageScope||"local")+"Storage"].setItem(n,a.dataset.syncId)),t&&(~(e=(n=window.location).hash?n.href.indexOf("#"):-1)&&window.history.replaceState(null,"",n.href.slice(0,e)),t.preventDefault())}function b(t){u.call(this,t);var a=this.tabs,n=this.tab,t=a.getBoundingClientRect().y,t=(d.call(document.querySelectorAll(".tabs"),function(e){e!==a&&e.dataset.syncGroupId===a.dataset.syncGroupId&&i(e,".tablist .tab","tab").forEach(function(t){t.dataset.syncId===n.dataset.syncId&&u.call({tabs:e,tab:t,isSync:!0})})}),a.getBoundingClientRect().y-t);(t=t&&Math.round(t))&&window.scrollBy({top:t,behavior:"instant"})}function i(t,e,a){var n=t.querySelector(e);if(!n)return[];for(var s=[n];(n=n.nextElementSibling)&&n.classList.contains(a);)s.push(n);return s}function e(t,e,a){d.call(t,function(t){t.classList[a](e)})}function y(t,e){t.classList[(t.hidden=e)?"add":"remove"]("is-hidden")}function p(t,e){t.setAttribute("aria-selected",""+e),t.classList[e?"add":"remove"]("is-selected"),t.tabIndex=e?0:-1}function a(){var t=window.location.hash.slice(1);t&&(t=document.getElementById(~t.indexOf("%")?decodeURIComponent(t):t))&&t.classList.contains("tab")&&("syncId"in t.dataset?b:u).call({tab:t})}r=(document.currentScript||{}).dataset||{},d=Array.prototype.forEach,(t=document.querySelectorAll(".tabs")).length&&(d.call(t,function(i){var o,l=i.classList.contains("is-sync")?{}:void 0,t=i.querySelector(".tablist ul");if(t.setAttribute("role","tablist"),d.call(t.querySelectorAll("li"),function(t,e){t.tabIndex=-1,t.setAttribute("role",t.classList.add("tab")||"tab");var a,n=(s=!(s=t.id)&&(n=t.querySelector("a[id]"))?t.id=n.parentNode.removeChild(n).id:s)&&i.querySelector('.tabpanel[aria-labelledby~="'+s+'"]');if(!n)return e?void 0:p(t,!0);l&&((a=t.textContent.trim())in l?a=void 0:l[t.dataset.syncId=a]=t),e||l&&(o={tab:t,panel:n})?y(n,!0):p(t,!0),t.setAttribute("aria-controls",n.id),n.setAttribute("role","tabpanel");var s=void 0===a?u:b;t.addEventListener("click",s.bind({tabs:i,tab:t,panel:n}))}),i.closest(".tabpanel")||d.call(i.querySelectorAll(".tabpanel table.tableblock"),function(t){var e=Object.assign(document.createElement("div"),{className:"tablecontainer"});t.parentNode.insertBefore(e,t).appendChild(t)}),o){for(var e,a,n=0,s=i.classList,c=s.length;n!==c;n++)if((a=s.item(n)).startsWith("data-sync-group-id=")){i.dataset.syncGroupId=e=s.remove(a)||a.slice(19).replace(/\u00a0/g," ");break}void 0===e&&(i.dataset.syncGroupId=e=Object.keys(l).sort().join("|"));t="syncStorageKey"in r&&window[(r.syncStorageScope||"local")+"Storage"].getItem(r.syncStorageKey+"-"+e),t=t&&l[t];t&&Object.assign(o,{tab:t,panel:document.getElementById(t.getAttribute("aria-controls"))}),p(o.tab,!0),y(o.panel,!1)}}),a(),e(t,"is-loading","remove"),window.setTimeout(e.bind(null,t,"is-loaded","add"),0),window.addEventListener("hashchange",a))})();