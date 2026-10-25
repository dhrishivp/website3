(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.querySelector(".sidebar-overlay");
  var desktopQuery = window.matchMedia("(min-width: 861px)");
  var lastFocused = null;

  /* ---------- Mobile sidebar ---------- */

  function isOpen() {
    return sidebar.classList.contains("is-open");
  }

  function focusableIn(el) {
    return Array.prototype.slice.call(
      el.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
  }

  function openSidebar() {
    if (isOpen()) return;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    sidebar.removeAttribute("inert");
    sidebar.setAttribute("aria-hidden", "false");
    // Force a reflow so the overlay fade-in transition runs after un-hiding.
    void overlay.offsetWidth;
    overlay.classList.add("is-visible");
    sidebar.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("no-scroll");
    var first = focusableIn(sidebar)[0];
    if (first) first.focus();
  }

  function closeSidebar(restoreFocus) {
    if (!isOpen()) return;
    sidebar.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    sidebar.setAttribute("inert", "");
    overlay.classList.remove("is-visible");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("no-scroll");
    window.setTimeout(function () {
      if (!isOpen()) overlay.hidden = true;
    }, 250);
    if (restoreFocus !== false && lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", function () {
      if (isOpen()) closeSidebar();
      else openSidebar();
    });

    document.querySelectorAll("[data-sidebar-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeSidebar();
      });
    });

    // Close after choosing a section; let the browser follow the link.
    sidebar.querySelectorAll("a[href^='#']").forEach(function (link) {
      link.addEventListener("click", function () {
        closeSidebar(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeSidebar();
        return;
      }
      if (e.key === "Tab") {
        var items = focusableIn(sidebar);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Resizing up to desktop with the sidebar open would leave the page
    // scroll-locked behind a hidden drawer, so reset it.
    var onBreakpoint = function (e) {
      if (e.matches) closeSidebar(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onBreakpoint);
    else if (desktopQuery.addListener) desktopQuery.addListener(onBreakpoint);
  }

  /* ---------- Header shadow on scroll ---------- */

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Opening hours: highlight today + open now ---------- */

  // Minutes since midnight. Day 0 is Sunday, matching Date#getDay.
  var HOURS = {
    0: [],
    1: [],
    2: [[720, 870], [1080, 1260]],
    3: [[720, 870], [1080, 1260]],
    4: [[720, 870], [1080, 1260]],
    5: [[720, 870], [1050, 1320]],
    6: [[720, 870], [1050, 1320]]
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Always use UK time, whatever the visitor's own timezone.
  function londonNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      var hour = parseInt(map.hour, 10) % 24;
      var minute = parseInt(map.minute, 10);
      if (day < 0 || isNaN(hour) || isNaN(minute)) throw new Error("bad time");
      return { day: day, minutes: hour * 60 + minute };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function nextOpening(now) {
    for (var offset = 0; offset < 8; offset++) {
      var day = (now.day + offset) % 7;
      var slots = HOURS[day];
      for (var i = 0; i < slots.length; i++) {
        if (offset > 0 || slots[i][0] > now.minutes) {
          var when = offset === 0 ? "today" : offset === 1 ? "tomorrow" : DAY_NAMES[day];
          return "Opens " + when + " at " + fmt(slots[i][0]);
        }
      }
    }
    return "";
  }

  function updateStatus() {
    var now = londonNow();

    var rows = document.querySelectorAll("[data-hours] tr");
    rows.forEach(function (row) {
      row.classList.toggle("is-today", Number(row.getAttribute("data-day")) === now.day);
    });

    var status = document.querySelector("[data-open-status]");
    if (!status) return;
    var slots = HOURS[now.day];
    var current = null;
    for (var i = 0; i < slots.length; i++) {
      if (now.minutes >= slots[i][0] && now.minutes < slots[i][1]) current = slots[i];
    }
    if (current) {
      status.textContent = "Open now, until " + fmt(current[1]);
      status.classList.add("is-open");
    } else {
      status.textContent = "Closed now. " + nextOpening(now);
      status.classList.remove("is-open");
    }
  }

  updateStatus();
  window.setInterval(updateStatus, 60 * 1000);

  /* ---------- Footer year ---------- */

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
