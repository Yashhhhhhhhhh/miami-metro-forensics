const fs = require('fs');
const test = require('node:test');
const assert = require('node:assert');

// Read the codebase
const html = fs.readFileSync('index.html', 'utf-8');

// Extract the Utils.code function definition using a regex
const match = html.match(/code:\s*\(\)\s*=>\s*(.*?toUpperCase\(\))/);
if (!match) throw new Error("Could not find Utils.code in index.html");

const codeFunctionStr = `return ${match[1]};`;
const generateCode = new Function(codeFunctionStr);

test('Utils.code generates a 6-character string', () => {
    const code = generateCode();
    assert.strictEqual(code.length, 6);
});

test('Utils.code generates uppercase alphanumeric characters', () => {
    const code = generateCode();
    assert.match(code, /^[A-Z0-9]{6}$/);
});

test('Utils.code has variance', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
        codes.add(generateCode());
    }
    // High probability we get 100 unique codes, but to avoid flakiness, assert > 95
    assert.ok(codes.size > 95);
});

test('Utils.code handles edge cases in Math.random', (t) => {
    const originalRandom = Math.random;

    try {
        // Test 0
        Math.random = () => 0;
        let code = generateCode();
        assert.strictEqual(code.length, 6, "Length should be 6 when Math.random() is 0");
        assert.match(code, /^[A-Z0-9]{6}$/);

        // Test 0.5 (toString(36) is '0.i', substring(2,8) is 'i')
        Math.random = () => 0.5;
        code = generateCode();
        assert.strictEqual(code.length, 6, "Length should be 6 when Math.random() is 0.5");
        assert.match(code, /^[A-Z0-9]{6}$/);

        // Test very small number
        Math.random = () => 0.0000000000000001;
        code = generateCode();
        assert.strictEqual(code.length, 6, "Length should be 6 for very small numbers");
        assert.match(code, /^[A-Z0-9]{6}$/);

        // Test very large number close to 1
        Math.random = () => 0.9999999999999999;
        code = generateCode();
        assert.strictEqual(code.length, 6, "Length should be 6 for numbers close to 1");
        assert.match(code, /^[A-Z0-9]{6}$/);

    } finally {
        Math.random = originalRandom;
    }
});
