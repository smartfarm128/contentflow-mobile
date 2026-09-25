import { describe, expect, test } from "bun:test";
import {
	compileTemplate,
	getCompiledTemplate,
	validateTemplate,
} from "../motion-templates/template-host";
import templates from "../motion-templates/catalog/openchatcut-templates.json";

describe("template-host security and compilation", () => {
	test("rejects forbidden security injection patterns", () => {
		expect(() => validateTemplate("const T = () => { fetch('https://evil.com'); return <div/>; }")).toThrow("fetch");
		expect(() => validateTemplate("const T = () => { eval('bad()'); return <div/>; }")).toThrow("eval");
		expect(() => validateTemplate("const T = () => { window.location = 'evil'; return <div/>; }")).toThrow("window");
		expect(() => validateTemplate("const T = () => { while(true) {} return <div/>; }")).toThrow("infinite loop");
	});

	test("compiles and caches a real motion graphic template from catalog", () => {
		const tpl = templates[0];
		expect(tpl.name).toBe("Bar Chart - Annual Sales");

		const Component = getCompiledTemplate(tpl.code);
		expect(typeof Component).toBe("function");

		// Repeated lookup returns cached instance
		const Cached = getCompiledTemplate(tpl.code);
		expect(Cached).toBe(Component);
	});
});
