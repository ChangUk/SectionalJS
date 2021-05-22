import renderMathInElement from "./lib/katex/contrib/auto-render.js";
import { Sectional } from "./lib/sectional/sectional-esm.js";
import { Remarkable } from "./lib/remarkable/remarkable.js";

// Initialization
fetch("data.json")
	.then(response => {
		if (response.ok) return response.json();
		return {};
	})
	.then(json => {
		let list = document.querySelector("#articles");
		let view = document.querySelector("#viewport");
		let sectional = new Sectional(view, json, {
			insertSections: true,
			callback: (el, ...params) => {
				if (el.tagName === "PRE") {
					el.classList.add("hljs");
					el.querySelectorAll("code").forEach(function (code) {
						if (code.classList.length) {
							const worker = new Worker("/assets/lib/highlight/10.7.2/worker.js");
							worker.onmessage = (e) => { code.innerHTML = e.data; }
							worker.postMessage(code.textContent);
						}
					});
				} else {
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
						throwOnError: false,
						delimiters: [
							{ left: "$$", right: "$$", display: true },
							{ left: "$", right: "$", display: false },
							{ left: "\\(", right: "\\)", display: false },
							{ left: "\\[", right: "\\]", display: true }
						]
					});
				}
			},
			entry: "0000000000000000000000"
		});

		let articles = sectional.getArticles();
		articles.forEach(articleId => {
			let div = document.createElement("div");
			div.style.setProperty("font-family", "consolas");
			div.style.setProperty("cursor", "pointer");
			div.innerHTML = articleId;
			div.addEventListener("click", e => {
				sectional.clearViewport();
				sectional.article(e.target.innerHTML);
				Array.from(document.querySelector("#articles").children).forEach(child => {
					child.classList.remove("selected");
				});
				e.target.classList.add("selected");
			});
			list.appendChild(div);
		});

		list.firstChild.click();
	});
