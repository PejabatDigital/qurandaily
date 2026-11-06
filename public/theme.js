/* Appearance (Profile): System, Light or Dark, saved on this device (src/lib/appearance.ts).
   Runs before the page paints so it never flashes the wrong colours. Same as MyDay. */
(function () {
  try {
    var t = localStorage.getItem("qd:theme");
    if (t !== "light" && t !== "dark") return;
    document.documentElement.dataset.theme = t;
    var c = t === "light" ? "#F6F7F9" : "#0B1020";
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.dataset.color = m.content;
      m.content = c;
    });
  } catch (e) {}
})();
