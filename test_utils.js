const test = require("node:test");
const assert = require("node:assert");

const time = (s) => {
    if (isNaN(s) || !isFinite(s) || s < 0) return "00:00";
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const sec = Math.floor(s%60);
    return h > 0
        ? `${h}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`
        : `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
};

test("Utils.time formatting", () => {
    assert.strictEqual(time(-10), "00:00");
    assert.strictEqual(time("abc"), "00:00");
    assert.strictEqual(time(3665), "1:01:05");
    assert.strictEqual(time(65), "01:05");
});
