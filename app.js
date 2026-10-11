/* ============================================================
   考研政治·时政热点日报 —— 渲染 + 详情视图 + 自测 + 下载
   ============================================================ */
(function(){
  "use strict";

  function star(n){
    var map = {五星:"★★★★★",四星:"★★★★☆",三星:"★★★☆☆"};
    return map[n] || n;
  }
  function el(tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  /* ---------- 年度时政总览 ---------- */
  function renderYear(){
    var wrap = document.getElementById("yearList");
    if(!wrap) return;
    var byMonth = {};
    YEAR_DATA.forEach(function(it){
      (byMonth[it.m] = byMonth[it.m] || []).push(it);
    });
    var keys = Object.keys(byMonth).sort();
    var html = "";
    keys.forEach(function(m){
      html += '<div class="month-group"><div class="mg-head">' +
              '<span class="mg-month">' + m.replace(".", "年") + '月</span>' +
              '<span class="mg-tag">' + (byMonth[m].length) + ' 条重点</span></div>' +
              '<ul class="year-list">';
      byMonth[m].forEach(function(it, i){
        html += '<li data-i="' + i + '" data-m="' + m + '"><span class="yl-no">' + (i + 1) + '</span>' +
                '<div class="yl-main"><div class="yl-title">' + it.title + '</div>' +
                '<div class="yl-abs">' + it.abs + '</div></div>' +
                '<div class="yl-meta"><span class="yl-star">' + star(it.level === 5 ? "五星" : it.level === 4 ? "四星" : "三星") + '</span>' +
                '<span>' + it.tag + '</span><span class="yl-more">查看详解 ›</span></div></li>';
      });
      html += '</ul></div>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll("li[data-i]").forEach(function(li){
      li.addEventListener("click", function(){
        var m = li.getAttribute("data-m");
        var item = (byMonth[m] || [])[parseInt(li.getAttribute("data-i"), 10)];
        if(item) openDetail(item, "年度总览");
      });
    });
  }

  /* ---------- 最新速览 ---------- */
  function renderLatest(){
    var wrap = document.getElementById("latestList");
    if(!wrap) return;
    var html = "";
    LATEST_DATA.forEach(function(it, idx){
      html += '<li data-idx="' + idx + '"><span class="yl-no">' + it.no + '</span>' +
              '<div class="yl-main"><div class="yl-title">[' + it.tag + '] ' + it.title + '</div>' +
              '<div class="yl-abs">' + it.abs + '</div></div>' +
              '<div class="yl-meta"><span class="yl-star">' + star(it.star) + '</span>' +
              '<span>' + it.date + '</span><span class="yl-more">查看详解 ›</span></div></li>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll("li[data-idx]").forEach(function(li){
      li.addEventListener("click", function(){
        var item = LATEST_DATA[parseInt(li.getAttribute("data-idx"), 10)];
        if(item) openDetail(item, "最新速览");
      });
    });
  }

  /* ---------- 考点图谱 ---------- */
  function renderGraph(){
    var fieldWrap = document.getElementById("fieldChart");
    if(fieldWrap){
      var max = 1;
      FIELD_STATS.forEach(function(f){ if(f.val > max) max = f.val; });
      var html = "";
      FIELD_STATS.forEach(function(f){
        var w = Math.round(f.val / max * 100);
        html += '<div class="bar-row"><span class="b-name">' + f.name + '</span>' +
                '<div class="b-track"><div class="b-fill" data-w="' + w + '" style="width:0%"></div></div>' +
                '<span class="b-val">' + f.val + '</span></div>';
      });
      fieldWrap.innerHTML = html;
      /* 动画：延迟触发宽度过渡 */
      setTimeout(function(){
        fieldWrap.querySelectorAll(".b-fill").forEach(function(b){
          b.style.width = b.getAttribute("data-w") + "%";
        });
      }, 120);
    }
    var hotWrap = document.getElementById("hotList");
    if(hotWrap){
      var h = "";
      HOT_TOPICS.forEach(function(t){
        h += '<div class="hot-item"><span class="h-no">' + t.no + '</span>' +
             '<span class="hname">' + t.name + '</span><span class="hsubj">' + t.subj + '</span></div>';
      });
      hotWrap.innerHTML = h;
    }
  }

  /* ---------- 时政刻度线（可点击节点展开详情） ---------- */
  function renderTimeline(){
    var wrap = document.getElementById("timeline");
    if(!wrap) return;
    var html = "";
    TIMELINE.forEach(function(t){
      var clickable = !!(typeof TIMELINE_LINKS !== "undefined" && TIMELINE_LINKS[t.title] !== undefined && TIMELINE_LINKS[t.title] !== null);
      html += '<li class="' + (t.key ? "key" : "") + (clickable ? " clickable" : "") + '" data-t="' + t.title + '">' +
              '<div class="t-date">' + t.date + '</div>' +
              '<div class="t-title">' + t.title + '</div>' +
              '<div class="t-sub">' + t.sub + '</div></li>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll("li[data-t].clickable").forEach(function(li){
      li.addEventListener("click", function(){
        var item = resolveTimelineLink(li.getAttribute("data-t"));
        if(item) openDetail(item, "时政刻度线");
      });
    });
  }

  /* ---------- 倒计时 ---------- */
  function countdown(){
    var el = document.getElementById("cdDays");
    if(!el) return;
    var exam = new Date(2026, 11, 19);
    var now = new Date();
    var days = Math.max(0, Math.ceil((exam - now) / 86400000));
    el.textContent = days;
  }

  /* ============ 详情视图（左原文 · 右批注 · 多方归纳） ============ */
  var overlay, panel;

  function noteTemplate(item){
    /* 无预置批注时的通用模板 */
    var tag = item.tag || "";
    var map = {
      "外交":  ["《当代》大国外交、多边外交；构建人类命运共同体。","单选多选考提法表述；分析题考中国外交原则与全球治理主张。","① 坚持独立自主的和平外交政策；② 推动构建新型国际关系；③ 共商共建共享的全球治理观。"],
      "党建":  ["《新思想》全面从严治党、党的自我革命；“两个永远在路上”。","单选考会议与文件；分析题考自我革命与历史周期率。","① 基础在全面、关键在严、要害在治；② 以党的自我革命引领社会革命。"],
      "经济":  ["《新思想》高质量发展、新发展格局、新质生产力。","单选考指标数据；分析题考高质量发展。","① 稳中求进工作总基调；② 统筹发展和安全。"],
      "科技":  ["《新思想》高水平科技自立自强；新质生产力。","单选考数据；分析题考科技自立自强。","① 科技自立自强是必由之路；② 强化国家战略科技力量。"],
      "民生":  ["《新思想》民生保障、多层次社会保障体系；以人民为中心。","多选考政策表述；分析题考民生福祉。","① 坚持尽力而为、量力而行；② 兜住兜准兜牢民生底线。"],
      "纪念":  ["《史纲》重要纪念节点与历史意义；中国式现代化。","单选考时间与表述；分析题考历史启示。","① 历史是最好的教科书；② 汲取奋进力量，走好新时代长征路。"],
      "体育":  ["《新思想》体育强国、文化自信。","单选考成绩数据。","① 加快建设体育强国；② 弘扬中华体育精神。"],
      "法治":  ["全面依法治国；以法治保障民生。","多选考新法内容与施行时间。","① 坚持人民至上；② 以良法促善治。"],
      "对台":  ["新时代党解决台湾问题的总体方略；祖国统一。","单选多选考原则表述。","① 一个中国原则和“九二共识”；② 坚决反“独”促统。"],
      "会议":  ["党的领导与决策程序；全过程人民民主。","单选考议程与时间。","① 坚持党中央集中统一领导；② 党的主张转化为国家意志。"],
      "规划":  ["“十五五”规划与中国式现代化。","多选考指标与工程；分析题考现代化路径。","① 高质量发展取得显著成效；② 建设现代化产业体系。"]
    };
    var key = null;
    Object.keys(map).forEach(function(k){
      if(tag.indexOf(k) >= 0) key = k;
    });
    var n = key ? map[key] : ["结合事件背景定位到对应课程模块（马原/新思想/史纲/思修/当代）复习。","关注官方表述与金句，选择题以识记为主。","答题时先答原理、再扣材料、最后点题升华。"];
    return [
      {k:"考点链接", v:n[0]},
      {k:"命题角度", v:n[1]},
      {k:"答题要点", v:n[2]}
    ];
  }

  function openDetail(item, from){
    var d = item.detail || {};
    var overview = (d.overview && d.overview.length) ? d.overview : [d.original || item.abs || ""];
    var data = (d.data && d.data.length) ? d.data : [];
    var book = d.book || null;
    var notes = (d.notes && d.notes.length) ? d.notes : noteTemplate(item);
    var golden = (d.golden && d.golden.length) ? d.golden : (d.golden ? [d.golden] : []);
    var digest = (d.digest && d.digest.length) ? d.digest : [];
    var src = d.originalUrl || "";

    panel.innerHTML = "";

    /* 顶部：返回 + 元信息 */
    var head = el("div","d-head");
    var back = el("button","d-back","← 返回列表");
    back.addEventListener("click", closeDetail);
    var meta = el("div","d-head-meta");
    meta.appendChild(el("span","","来自：" + from));
    meta.appendChild(el("span","", item.date || item.m || ""));
    meta.appendChild(el("span","","来源：" + item.src));
    head.appendChild(back);
    head.appendChild(meta);
    panel.appendChild(head);

    /* 标题 */
    var tWrap = el("div","d-title");
    var tag = el("span","d-tag", item.tag || "");
    tWrap.appendChild(tag);
    tWrap.appendChild(document.createTextNode(item.title));
    panel.appendChild(tWrap);

    /* 双栏主体 */
    var body = el("div","d-body");

    /* 左栏：原文 + 关键数据 */
    var left = el("div","d-original");
    left.appendChild(el("h4","","原文 · 官方报道"));
    overview.forEach(function(para, i){
      var p = el("p","d-orig-text", para);
      if(i > 0) p.classList.add("d-orig-sub");
      left.appendChild(p);
    });
    if(data.length){
      var dWrap = el("div","d-data");
      dWrap.appendChild(el("h5","","关键数据 · 数字考点"));
      var ul = el("ul","");
      data.forEach(function(x){
        var li = el("li","", x);
        ul.appendChild(li);
      });
      dWrap.appendChild(ul);
      left.appendChild(dWrap);
    }
    /* 完整总结（原文之后直接呈现） */
    var summary = getSummary(item);
    if(summary){
      var sWrap = el("div","d-summary");
      sWrap.appendChild(el("h5","","完整总结 · 事件全貌与考点启示"));
      sWrap.appendChild(el("p","", summary));
      left.appendChild(sWrap);
    }
    if(src){
      var a = el("a","d-orig-src","查看官方报道原文 ↗");
      a.href = src;
      a.target = "_blank";
      a.rel = "noopener";
      left.appendChild(a);
    }
    body.appendChild(left);

    /* 右栏：书本联系 → 批注 → 金句 → 多方归纳 */
    var right = el("div","d-notes");

    if(book && (book.ref || (book.points && book.points.length))){
      right.appendChild(el("h4","","书本联系 · 考点定位"));
      var bk = el("div","d-book");
      if(book.ref) bk.appendChild(el("p","bk-ref", book.ref));
      if(book.points && book.points.length){
        var pl = el("ol","bk-points");
        book.points.forEach(function(p){
          pl.appendChild(el("li","", p));
        });
        bk.appendChild(pl);
      }
      right.appendChild(bk);
    }

    right.appendChild(el("h4","","批注讲解"));
    var dl = el("dl","");
    notes.forEach(function(n){
      var dt = el("dt","", n.k);
      var dd = el("dd","", n.v);
      var box = el("div","d-note");
      box.appendChild(dt);
      box.appendChild(dd);
      dl.appendChild(box);
    });
    right.appendChild(dl);

    if(golden.length){
      golden.forEach(function(gtext){
        var g = el("div","d-golden");
        g.appendChild(el("span","g-label","关键金句 · 可背诵"));
        g.appendChild(document.createTextNode(gtext));
        right.appendChild(g);
      });
    }

    if(digest.length){
      var dig = el("div","d-digest");
      dig.appendChild(el("h5","","多方归纳 · 网络热点整理汇总"));
      digest.forEach(function(x){
        var item2 = el("div","digest-item");
        item2.appendChild(el("span","dig-org", x.org));
        item2.appendChild(el("span","dig-txt", x.v));
        dig.appendChild(item2);
      });
      right.appendChild(dig);
    } else {
      right.appendChild(el("div","d-empty","（该条暂未收录多方归纳，可待每日更新补充）"));
    }

    body.appendChild(right);
    panel.appendChild(body);

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    panel.scrollTop = 0;
  }

  function closeDetail(){
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function initDetail(){
    overlay = document.getElementById("detailOverlay");
    panel = document.getElementById("detailPanel");
    overlay.addEventListener("click", function(e){
      if(e.target === overlay) closeDetail();
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && overlay.classList.contains("open")) closeDetail();
    });
  }

  /* ---------- 本月焦点卡片：点击查看完整详解 ---------- */
  function initFocus(){
    var cards = document.querySelectorAll(".focus-card[data-key]");
    cards.forEach(function(card){
      card.addEventListener("click", function(){
        var item = findFocusByKey(card.getAttribute("data-key"));
        if(item) openDetail(item, "本月焦点");
        else {
          /* 兜底：以卡片标题匹配 */
          var title = (card.querySelector("h3") || {}).textContent || "";
          var found = null;
          YEAR_DATA.forEach(function(it){ if(!found && it.title === title) found = it; });
          if(found) openDetail(found, "本月焦点");
        }
      });
    });
  }

  /* ---------- 关键词检索（本地 + 网络） ---------- */
  function allItems(){
    return YEAR_DATA.concat(LATEST_DATA);
  }
  function filterItems(q){
    q = (q || "").trim().toLowerCase();
    if(!q) return [];
    return allItems().filter(function(it){
      var hay = (it.title + " " + it.tag + " " + it.abs + " " + (it.src || "")).toLowerCase();
      var s = getSummary(it);
      if(s) hay += " " + s;
      if(it.detail){
        if(it.detail.original) hay += " " + it.detail.original;
        if(it.detail.golden){
          var g = Array.isArray(it.detail.golden) ? it.detail.golden.join(" ") : it.detail.golden;
          hay += " " + g;
        }
      }
      return hay.indexOf(q) >= 0;
    });
  }
  function renderSearchResults(list){
    var wrap = document.getElementById("kwResults");
    if(!wrap) return;
    if(!list || !list.length){
      wrap.innerHTML = '<div class="search-empty">未在本地热点中找到匹配项，点击「网络搜索」可获取更多网络整理内容。</div>';
      return;
    }
    var html = '<ul class="year-list">';
    list.forEach(function(it, idx){
      var lv = it.level ? (it.level === 5 ? "五星" : it.level === 4 ? "四星" : "三星") : (it.star || "三星");
      html += '<li data-idx="' + idx + '"><span class="yl-no">' + (idx + 1) + '</span>' +
              '<div class="yl-main"><div class="yl-title">' + (it.m ? ("[" + it.m + "] ") : "[最新] ") + it.title + '</div>' +
              '<div class="yl-abs">' + it.abs + '</div></div>' +
              '<div class="yl-meta"><span class="yl-star">' + star(lv) + '</span><span class="yl-more">查看详解 ›</span></div></li>';
    });
    html += '</ul>';
    wrap.innerHTML = html;
    wrap.querySelectorAll("li[data-idx]").forEach(function(li){
      li.addEventListener("click", function(){
        openDetail(list[parseInt(li.getAttribute("data-idx"), 10)], "检索结果");
      });
    });
  }
  function initSearch(){
    var input = document.getElementById("kwInput");
    var localBtn = document.getElementById("kwLocal");
    var webBtn = document.getElementById("kwWeb");
    var count = document.getElementById("kwCount");
    function doLocal(){
      var q = input ? input.value : "";
      var list = filterItems(q);
      renderSearchResults(list);
      if(count) count.textContent = list.length ? ("本地匹配 " + list.length + " 条") : "";
      var r = document.getElementById("kwResults");
      if(r) r.scrollIntoView({behavior:"smooth", block:"nearest"});
    }
    if(localBtn) localBtn.addEventListener("click", doLocal);
    if(input) input.addEventListener("keydown", function(e){ if(e.key === "Enter") doLocal(); });
    if(webBtn) webBtn.addEventListener("click", function(){
      var q = (input && input.value.trim()) ? input.value.trim() : "2026 考研政治 时政热点 整理";
      window.open("https://www.bing.com/search?q=" + encodeURIComponent("考研政治 时政 " + q), "_blank", "noopener");
    });
  }

  /* ---------- 热点云图 ---------- */
  function renderCloud(){
    var wrap = document.getElementById("cloudBox");
    if(!wrap) return;
    var html = "";
    HOT_KEYWORDS.forEach(function(kw){
      var size = 13 + Math.round(kw.n * 1.25);
      html += '<button class="cloud-item" data-k="' + kw.k + '" style="font-size:' + size + 'px">' + kw.w + '</button>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll(".cloud-item").forEach(function(b){
      b.addEventListener("click", function(){
        var k = b.getAttribute("data-k");
        var input = document.getElementById("kwInput");
        if(input) input.value = k;
        var list = filterItems(k);
        renderSearchResults(list);
        var count = document.getElementById("kwCount");
        if(count) count.textContent = list.length ? ("本地匹配 " + list.length + " 条") : "";
        var r = document.getElementById("kwResults");
        if(r) r.scrollIntoView({behavior:"smooth", block:"nearest"});
      });
    });
  }

  /* ---------- 自测判分 ---------- */
  function initQuiz(){
    var items = document.querySelectorAll(".quiz-item");
    items.forEach(function(item){
      var correct = (item.getAttribute("data-answer") || "").split(",").map(function(s){ return s.trim(); });
      var opts = item.querySelectorAll(".quiz-opt");
      var ans = item.querySelector(".quiz-ans");
      var reset = item.querySelector(".quiz-reset");

      opts.forEach(function(opt){
        opt.addEventListener("click", function(){
          if(item.classList.contains("done")) return;
          var val = opt.getAttribute("data-v");
          if(correct.indexOf(val) >= 0){
            opt.classList.add("correct");
          } else {
            opt.classList.add("wrong");
          }
          if(correct.length > 1){
            var wrongPicked = item.querySelectorAll(".quiz-opt.wrong").length;
            var picked = [];
            opts.forEach(function(o){
              if(o.classList.contains("correct") || o.classList.contains("wrong")) picked.push(o.getAttribute("data-v"));
            });
            if(wrongPicked > 0){
              item.classList.add("done");
              if(ans){ ans.classList.add("show"); ans.innerHTML = '<b>答错了。</b>' + ans.getAttribute("data-explain"); }
            } else if(picked.length === correct.length){
              item.classList.add("done");
              if(ans){ ans.classList.add("show"); ans.innerHTML = '<b>回答正确。</b>' + ans.getAttribute("data-explain"); }
            }
          } else {
            opts.forEach(function(o){ if(o !== opt) o.classList.remove("selected"); });
            opt.classList.add("selected");
            item.classList.add("done");
            if(ans){
              ans.classList.add("show");
              ans.innerHTML = (val === correct[0] ? '<b>回答正确。</b>' : '<b>回答错误。</b>') + ans.getAttribute("data-explain");
            }
          }
        });
      });
      if(reset){
        reset.addEventListener("click", function(){
          item.classList.remove("done");
          opts.forEach(function(o){ o.classList.remove("correct","wrong","selected"); });
          if(ans){ ans.classList.remove("show"); }
        });
      }
    });
  }

  /* ---------- 下载：Markdown ---------- */
  function buildMarkdown(){
    var lines = [];
    lines.push("# 考研政治·时政热点整理（2026 全年）");
    lines.push("");
    lines.push("> 生成时间：" + new Date().toLocaleString("zh-CN") + "｜来源：新华社、人民日报、中国政府网、求是网等官方渠道");
    lines.push("");
    lines.push("## 年度时政总览（2025.12—2026.10）");
    lines.push("");
    var byMonth = {};
    YEAR_DATA.forEach(function(it){ (byMonth[it.m] = byMonth[it.m] || []).push(it); });
    Object.keys(byMonth).sort().forEach(function(m){
      lines.push("### " + m.replace(".", "年") + "月");
      byMonth[m].forEach(function(it){
        lines.push("- **" + it.title + "**（" + it.tag + "，" + star(it.level === 5 ? "五星" : it.level === 4 ? "四星" : "三星") + "）");
        lines.push("  " + it.abs);
        lines.push("  来源：" + it.src);
        if(it.detail){
          if(it.detail.original) lines.push("  原文：" + it.detail.original);
          if(it.detail.golden) lines.push("  金句：" + it.detail.golden);
          if(it.detail.digest && it.detail.digest.length){
            it.detail.digest.forEach(function(x){
              lines.push("  - 多方归纳（" + x.org + "）：" + x.v);
            });
          }
        }
      });
      lines.push("");
    });
    lines.push("## 最新速览（近两周）");
    lines.push("");
    LATEST_DATA.forEach(function(it){
      lines.push("- **[" + it.tag + "] " + it.title + "**（" + star(it.star) + "，" + it.date + "）");
      lines.push("  " + it.abs);
      lines.push("  来源：" + it.src);
    });
    lines.push("");
    lines.push("## 考点图谱");
    lines.push("");
    FIELD_STATS.forEach(function(f){
      lines.push("- " + f.name + "：" + f.val + " 条");
    });
    lines.push("");
    lines.push("## 命题热度榜");
    lines.push("");
    HOT_TOPICS.forEach(function(t){
      lines.push("- " + t.no + ". " + t.name + "（" + t.subj + "）");
    });
    lines.push("");
    lines.push("---");
    lines.push("本文件由「考研政治·时政热点日报」自动整理，供备考复习使用。");
    return lines.join("\n");
  }

  /* ---------- 下载：CSV ---------- */
  function buildCSV(){
    function esc(s){
      s = String(s).replace(/"/g, '""');
      return '"' + s + '"';
    }
    var rows = [];
    rows.push(["月份","领域","星级","标题","摘要","金句","来源"].join(","));
    YEAR_DATA.forEach(function(it){
      rows.push([it.m, it.tag, it.level, it.title, it.abs, (it.detail && it.detail.golden) || "", it.src].map(esc).join(","));
    });
    LATEST_DATA.forEach(function(it){
      rows.push(["最新", it.tag, it.star, it.title, it.abs, (it.detail && it.detail.golden) || "", it.src].map(esc).join(","));
    });
    return "\ufeff" + rows.join("\n");
  }

  /* ---------- 下载工具 ---------- */
  function saveFile(filename, content, mime){
    var blob = new Blob([content], {type: mime || "text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 800);
  }

  function initDownload(){
    var mdBtn = document.getElementById("dlMd");
    var csvBtn = document.getElementById("dlCsv");
    var copyBtn = document.getElementById("dlCopy");
    var tip = document.getElementById("dlTip");
    function flash(msg){
      if(tip){ tip.textContent = msg; tip.style.color = "#B02736"; setTimeout(function(){ tip.style.color = ""; }, 2600); }
    }
    if(mdBtn) mdBtn.addEventListener("click", function(){
      saveFile("考研政治时政热点整理.md", buildMarkdown(), "text/markdown;charset=utf-8");
      flash("已导出 Markdown 整理稿（含原文与金句）");
    });
    if(csvBtn) csvBtn.addEventListener("click", function(){
      saveFile("考研政治时政热点数据.csv", buildCSV(), "text/csv;charset=utf-8");
      flash("已导出 CSV 数据表（可用 Excel 打开）");
    });
    if(copyBtn) copyBtn.addEventListener("click", function(){
      var text = buildMarkdown();
      function done(){ flash("整理文本已复制到剪贴板"); }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done, function(){ fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  }
  function fallbackCopy(text){
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch(e){}
    document.body.removeChild(ta);
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    initDetail();
    initFocus();
    initSearch();
    renderCloud();
    renderYear();
    renderLatest();
    renderGraph();
    renderTimeline();
    countdown();
    initQuiz();
    initDownload();
  });
})();
