function isPriortiyTab(tab_url, tab_title, priority_strings) {
    for (var p in priority_strings) {
        priority_string = priority_strings[p].trim();
        if (priority_string) {
            if (tab_url.toLowerCase().includes(priority_string.toLowerCase()) || tab_title.toLowerCase().includes(priority_string.toLowerCase())) {
                return true;
            }
        }
    }
    return false;
}

function constructTabs(tabs) { 
    let tab_html = "";
    tabs.forEach((function(tab) {
        let pinned = tab.pinned ? " pinned" : "";
        let muted = tab.mutedInfo.muted ? " muted" : "";
        let audible = tab.audible && !tab.mutedInfo.muted ? `audible` : "";
        tab_html += `<div class='tab' tab-title='${tab.title}'' tab-url='${tab.url}' tab-id='${tab.id}' window-id='${tab.windowId}'>
                         <img class="tab-favicon" src="${tab.favIconUrl}">
                         <div class="tab-title">${tab.title}
                            <svg class='tab-audible ${audible}' width="12px" height="12px" viewBox="0 0 75 75"><path d="M39.389,13.769 L22.235,28.606 L6,28.606 L6,47.699 L21.989,47.699 L39.389,62.75 L39.389,13.769z" style="stroke-width:5;stroke-linejoin:round;"/><path d="M48,27.6a19.5,19.5 0 0 1 0,21.4M55.1,20.5a30,30 0 0 1 0,35.6M61.6,14a38.8,38.8 0 0 1 0,48.6" style="fill:none;stroke-width:5;stroke-linecap:round"/></svg>
                         </div>
                         <div class='tab-muted${muted}'>
                            <svg width="12px" height="12px" viewBox="0 0 90 75"><polygon points="39.389,13.769 22.235,28.606 6,28.606 6,47.699 21.989,47.699 39.389,62.75 39.389,13.769" style="stroke:#111111;stroke-width:5;stroke-linejoin:round;fill:#111111;" /><path d="M 53,55 83,21" style="fill:none;stroke:#111111;stroke-width:5;stroke-linecap:round"/><path d="M 83,55 53,21" style="fill:none;stroke:#111111;stroke-width:5;stroke-linecap:round"/></svg>
                         </div>
                         <div class='tab-pinned${pinned}'>
                            <svg width="12px" height="12px" viewBox="0 0 640 640"><path d="M436.872 2.386l200.766 200.778c3.142 3.13 3.142 8.256 0 11.398l-68.375 68.363c-3.13 3.141-8.256 3.141-11.386 0l-19.441-19.43-90.12 90.096c20.221 76.146.497 160.715-59.22 220.42a196.268 196.268 0 0 1-4.205 4.098c-5.233 4.973-4.394 4.95-9.45-.106L247.906 450.454 0 639.976 189.58 392.13 61.844 264.416c-5.09-5.102-4.666-4.3.342-9.567a237.905 237.905 0 0 1 3.827-3.921c59.706-59.706 144.285-79.442 220.432-59.222L376.54 101.6l-19.441-19.441c-3.13-3.13-3.13-8.256 0-11.398l68.374-68.375c3.142-3.13 8.268-3.13 11.398 0z"/></svg>
                         </div>
                         <div class="tab-close">
                            <svg width="12px" height="12px" viewBox="0 0 100 100"><path d="M 10,10 90,90" style="fill:none;stroke:#111111;stroke-width:15;stroke-linecap:round" /><path d="M 10,90 90,10" style="fill:none;stroke:#111111;stroke-width:15;stroke-linecap:round" /></svg>
                         </div>
                     </div>`
    }));
    return tab_html;
}

function constructWindow(window_tabs, window_title) {
    return `<div class='window'>
                <div class='header'>${window_title} (<span class="window-tab-count">${window_tabs.length}</span> <span class="window-tab-s">tab${window_tabs.length > 1 ? 's' : ''}</span>)
                </div>
                ${constructTabs(window_tabs)}
            </div`;
}

function constructHTML(windows){
    let window_pos = 1;
    let priority_tabs = [];
    let audible_tabs = [];

    var storageDefaults = {
      audible: true,
      priority: ""
    };
    chrome.storage.sync.get(storageDefaults, function(tab_defaults) {
        let priority_tab_string_list = tab_defaults.priority.split("\n");
        windows.forEach((function(cur_window) {
            let window_title = "";
            window_title = "Current Window";
            if (!cur_window.focused) {
                window_title = `Window #${window_pos}`;
                window_pos += 1;
            }
            window_html = constructWindow(cur_window.tabs, window_title);
            if (cur_window.focused && $(".window").length) { 
                $(window_html).insertBefore($("#list").children().eq(0));
            } else {
                $("#list").append(window_html);
            }

            for (var tab in cur_window.tabs) {
                if (isPriortiyTab(cur_window.tabs[tab].url, cur_window.tabs[tab].title, priority_tab_string_list)) {
                    priority_tabs.push(cur_window.tabs[tab]);
                }
                if (tab_defaults.audible && cur_window.tabs[tab].audible && !cur_window.tabs[tab].mutedInfo.muted) {
                    audible_tabs.push(cur_window.tabs[tab]);
                }
            }
        }));

        if (audible_tabs.length) {
            audible_window_html = constructWindow(audible_tabs, "Audible Tabs");
            $(audible_window_html).insertBefore($("#list").children().eq(0))
        }
        if (priority_tabs.length) {
            priority_window_html = constructWindow(priority_tabs, "Priority Tabs");
            $(priority_window_html).insertBefore($("#list").children().eq(0))
        }

        $(".tab").on("click", (function() {
            openTab();
        }));
        $(".tab-close").on("click", (function() {
            closeTab();
        }));
        $(".tab-pinned").on("click", (function() {
            togglePinTab();
        }));
        $(".tab-muted").on("click", (function() {
            toggleMuteTab();
        }));
        $(".tab:visible").eq(0).addClass("selected");
        $(".tab").mousemove((function(e) {
            if (e.currentTarget.className !== "tab selected") { 
                $(".tab.selected").removeClass("selected");
            }
            e.currentTarget.className = "tab selected";
        }));
    });
}

function renderTabs() {
    chrome.windows.getAll({
        populate: true
    }, (function(windows) {
        constructHTML(windows);
    }))
}

function keyUpHandler(key) {
    $("#search").focus();
    if (40 != key.keyCode && 38 != key.keyCode) { // Up and Down Arrow
        filterTabs();
    }
    event.preventDefault();
}

function keyDownHandler(key) {
    $("#search").focus();
    let key_pressed = key.keyCode;
    if (key_pressed == 27) { // Escape key
        window.close();
    }
 
    let visable_tabs = $(".tab:visible");
    let selected_tab = visable_tabs.index($(".selected"));
    if (40 == key_pressed) { // Down Arrow
        selected_tab = (selected_tab + 1)%(visable_tabs.length);
        $(".tab.selected").removeClass("selected");
        visable_tabs.eq(selected_tab).addClass("selected");
        scrollToTab(selected_tab);
        event.stopPropagation();
        event.preventDefault();
    }
    else if (38 == key_pressed) { // Up Arrow
        selected_tab = (selected_tab - 1)%(visable_tabs.length);
        if (selected_tab < 0) {
            selected_tab = (selected_tab+visable_tabs.length)%(visable_tabs.length);
        }
        $(".tab.selected").removeClass("selected"); 
        visable_tabs.eq(selected_tab).addClass("selected");
        scrollToTab(selected_tab);
        event.stopPropagation();
        event.preventDefault();
    }
    else if (13 == key_pressed) { // Enter
        openTab();
    } 
    else {
        filterTabs();
    }
}

function shouldFilterTab(searches, tab_url, tab_title) {
    for (var s in searches) {
        let regex = new RegExp(searches[s], "gi");
        if ( !(regex.test(tab_url) || regex.test(tab_title)) ) {
            return false;
        }
    }
    return true;
}

function filterTabs() {
    let search = $("#search").val() || "";
    let searches = search.split(" ");
    let tabs = $(".tab");
    for (let t = 0; t < tabs.length; t++) {
        cur_tab = tabs.eq(t);
        if (shouldFilterTab(searches, cur_tab.attr("tab-url"), cur_tab.attr("tab-title"))) {
            cur_tab.show();
        } else {
            cur_tab.hide();
        }
    }

    $(".tab.selected").removeClass("selected");
    // TODO: Don't jump to the first tab, if the tb that is currently selected isn't removed.
    $(".tab:visible").eq(0).addClass("selected");

    $(".window").show();
    let windows = $(".window");
    for (let w = 0; w < windows.length; w++) {
        if (!windows.eq(w).children(".tab:visible").length) {
            windows.eq(w).hide();
        }
    }
}

function openTab() {
    let window_id = parseInt($(".selected").eq(0).attr("window-id"));
    let tab_id = parseInt($(".selected").eq(0).attr("tab-id"));
    chrome.windows.update(window_id, {
        focused: true
    });
    try {
        chrome.tabs.update(tab_id, {
            active: true
        }), window.close()
    } catch (error) {
        alert(error);
    }
}

function updateTabCount(tab) {
    let window_count_element = $(tab).siblings(".header").children(".window-tab-count");
    let window_s_element = $(tab).siblings(".header").children(".window-tab-s");
    let cur_count = parseInt(window_count_element.eq(0).html()) - 1;
    let include_s = cur_count > 1 ? "tabs" : "tab";
    window_count_element.html(cur_count);
    window_s_element.html(include_s)
}

function closeTab(t) {
    let tab = t || $(".selected");
    let tab_id = parseInt(tab.attr("tab-id"));
    updateTabCount(tab);
    if (tab.siblings(".tab:visible").length == 0) {
        tab.parent()[0].remove();
    } else {
        tab.remove();
    }
    chrome.tabs.remove(tab_id);

    let other_tabs = $(`[tab-id='${tab_id}']`);
    for (let t = 0; t < other_tabs.length; t++) {
        let cur_tab = other_tabs.eq(t);
        updateTabCount(cur_tab);
        if (cur_tab.siblings(".tab:visible").length == 0) { 
            cur_tab.parent()[0].remove();
        } else {
            cur_tab.remove();
        }
    }

    $("#search").focus();
    $(".tab").hover((function(e) {
        if (e.currentTarget.className !== "tab selected") { 
            $(".tab.selected").removeClass("selected");
        }
        e.currentTarget.className = "tab selected";
    }));
    event.stopPropagation();
}

function togglePinTab() {
    let tab = $(".selected .tab-pinned");
    let tab_id = parseInt($(".selected").attr("tab-id"));
    let other_tabs = $(`[tab-id='${tab_id}']`).not('.selected').children('.tab-pinned');
    tab.hasClass("pinned") ? (tab.removeClass("pinned"), chrome.tabs.update(tab_id, {
        pinned: false
    })) : (tab.addClass("pinned"), chrome.tabs.update(tab_id, {
        pinned: true
    }));

    for (let t = 0; t < other_tabs.length; t++) {
        let cur_tab = other_tabs.eq(t);
        cur_tab.hasClass("pinned") ? cur_tab.removeClass("pinned") : cur_tab.addClass("pinned");
    }

    $("#search").focus();
    event.stopPropagation();
}

function toggleMuteTab() {
    let tab = $(".selected .tab-muted");
    let tab_id = parseInt($(".selected").attr("tab-id"));
    let other_tabs = $(`[tab-id='${tab_id}']`).not('.selected').children('.tab-muted');
    tab.hasClass("muted") ? (tab.removeClass("muted"), chrome.tabs.update(tab_id, {
        muted: false
    })) : (tab.addClass("muted"), chrome.tabs.update(tab_id, {
        muted: true
    }));

    for (let t = 0; t < other_tabs.length; t++) {
        let cur_tab = other_tabs.eq(t);
        cur_tab.hasClass("muted") ? cur_tab.removeClass("muted") : cur_tab.addClass("muted");
    }

    $("#search").focus();
    event.stopPropagation();
}

function scrollToTab(tab) {
    let tab_container = this.$(".tab-container");
    let visible_tabs = this.$(".tab:visible") || [];
    if (visible_tabs[tab]) {
        let cur_tab = $(visible_tabs[tab])

        let tab_offset = cur_tab.offset().top + cur_tab.outerHeight(true);
        let html_offset = $("html").scrollTop() + $(window.top).height() - 50;
        if (tab_offset > html_offset) {
            tab_container.scrollTop(tab_container.scrollTop() + (tab_offset - html_offset));
        }

        let height_diff = cur_tab.offset().top - tab_container.offset().top - 50;
        if (height_diff < 0) {
            tab_container.scrollTop(tab_container.scrollTop() + height_diff);
        }
        if (0 === tab) {
            tab_container.scrollTop(0);
        }
    }
}

function updateTabs() {
    let tabs = $(".tab");
    console.time("start");

    for (let t = 0; t < tabs.length; t++) {
        let cur_tab = tabs.eq(t);
        let tab_id = parseInt(cur_tab.attr("tab-id"));
        chrome.tabs.get(
            tab_id
        , (function(tab) {
            tab.pinned ? cur_tab.children('.tab-pinned').addClass("pinned") : cur_tab.children('.tab-pinned').removeClass("pinned");
            tab.mutedInfo.muted ? cur_tab.children('.tab-muted').addClass("muted") : cur_tab.children('.tab-muted').removeClass("muted");
            tab.audible && !tab.mutedInfo.muted ?  cur_tab.find('.tab-audible').fadeIn(600) : cur_tab.find('.tab-audible').fadeOut(600);
        }));
    }
    console.timeEnd("start");
}

document.addEventListener("DOMContentLoaded", (
    function() {
        $("body").on("keydown", keyDownHandler);
        $("body").on("keyup", keyUpHandler);
        // TODO: this runs a little slow
        renderTabs();
        // TODO:
        // 1. Find out if this kills cpu (I don't think it does but I don't JS well)
        // 2. Update to sync with a tabs actions
        setInterval(updateTabs, 100);
}));

