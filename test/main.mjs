import { ShortUuidV4 } from "./lib/short-uuidv4/short-uuidv4.js";
import renderMathInElement from "./lib/katex/contrib/auto-render.js";
import { Sectional } from "../dist/esm/sectional.js";
import { Remarkable } from "./lib/remarkable/remarkable.js";

// Initialization
console.clear();

let uuid = (quotation = false) => {
	let newUuid = new ShortUuidV4().new();
	return quotation ? `"${newUuid}"` : newUuid;
};

fetch("sample_data.json")
	.then(response => {
		console.log(`"${uuid()}", "${uuid()}", "${uuid()}"`);
		if (response.ok) return response.json();
		return {};
	})
	.then(json => {
		let view = document.querySelector("#viewport");
		let sectional = new Sectional(view, json, (el, ...params) => {
			// Translate markdown syntax
			let markdown = new Remarkable("commonmark", {});
			el.innerHTML = markdown.render(el.innerHTML);
			if (el.children.length === 1) {
				// In genenral, texts are transformed into <p> element.
				el.innerHTML = el.innerHTML.replace(/^(\s*<p>)|(<\/p>\s*)$/g, "");
			} else if (el.children.length > 1) {
				let div = document.createElement("div");
				div.innerHTML = el.innerHTML;
				el.innerHTML = "";
				el.appendChild(div);
			}

			// Render math equations
			renderMathInElement(el, {
				delimiters: [
					{left: "$$", right: "$$", display: true},
					{left: "$", right: "$", display: false},
					{left: "\\(", right: "\\)", display: false},
					{left: "\\[", right: "\\]", display: true}
				]
			});
		});
		sectional.article("7cx8uXwwlN3hyyGh7eKnla");
	});
