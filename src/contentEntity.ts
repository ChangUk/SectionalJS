import type { EntityID, EntityRecord, Callback } from "./entity.js";
import { Entity } from "./entity.js";

const Debounce = (func: Function, wait: number, immediate: boolean = false) => {
	let timeout: ReturnType<typeof setTimeout>;
	return function (this: ThisParameterType<Function>, ...args: any[]) {
		if (!timeout && immediate) func.apply(this, args);
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

export class ContentEntity extends Entity {
	constructor(id: EntityID, data: Record<EntityID, EntityRecord>, callback: Callback) {
		super(id, data, callback);
	}

	protected _setAction(id: EntityID, el: HTMLElement) {
		if (!id) return null;
		let entity = this._getEntity(id);
		if (!entity) return;

		el.classList.add(this.clsfmt("action"));
		el.addEventListener("click", (e) => {
			let target = <HTMLElement>e.target;
			if (target && target.hasAttribute("action")) {
				let action = target.getAttribute("action");
				if (action) this._action(action);
			}
		});
		el.setAttribute("action", entity.action);
		let actionEntity = this._getEntity(entity.action);
		if (actionEntity && actionEntity.type === "url") el.setAttribute("title", actionEntity.content);
	}

	protected _action(id: EntityID) {
		let entity = this._getEntity(id);
		if (!entity) return;

		if (entity.type === "url") {
			window.open(entity.content);
		} else if (entity.type === "dataurl") {
			let header = entity.content.split(",");
			let mime = header[0].match(/:(.*?);/)[1];
			let bstr = atob(header[1]);
			let n = bstr.length;
			let ui8a = new Uint8Array(n);
			while (n--) ui8a[n] = bstr.charCodeAt(n);
			window.open(URL.createObjectURL(new Blob([ui8a], { type: mime })));
		}
	}
}

export class Paragraph extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let p = document.createElement("p");
		p.id = this.idfmt(this._id);
		p.innerHTML = entity.content;
		parentEl.appendChild(p);
		this._callback.call(this, p);
		return p;
	}
}

export class Image extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let img = document.createElement("img");
		img.id = this.idfmt(this._id);
		img.src = entity.content;
		parentEl.appendChild(img);

		// TODO: options

		return img;
	}
}

export class Code extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let pre = document.createElement("pre");
		pre.id = this.idfmt(this._id);
		parentEl.appendChild(pre);

		let code = document.createElement("code");
		code.className = `language-${entity.language}`;
		code.innerHTML = entity.content;
		pre.appendChild(code);
		this._callback.call(this, pre);
		return pre;
	}
}

export class Ulist extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let ul = document.createElement("ul");

		// TODO: listing

		return ul;
	}
}

export class Olist extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let ol = document.createElement("ol");

		// TODO: listing

		return ol;
	}
}

export class Table extends ContentEntity {
	private _headerDepth: number = 0;
	private _rowHeaderDepth: number = 0;

	// Optional
	private _classlist: Array<Array<string>> = [];

	constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback) {
		super(id, data, callback);
		let entity = this._getEntity(this._id);
		if (!entity) throw new Error(`Invalid identifier of table: ${this._id}`);

		// Entity inspection
		if ("content" in entity) {
			let content: Record<string, any> = entity.content;
			if (!("body" in content) || !this._getEntity(content.body))
				throw new Error(`Body is necessarily required: ${content.toString()}`);
		} else throw new Error(`Incomplete entity: ${entity.toString()}`);

		if ("properties" in entity) {
			let subEntity = this._getEntity(entity.properties);
			if (subEntity) {
				let properties: Record<string, any> = subEntity.content;

				// TODO: properties (not defined yet)
			}
		}

		if ("classlist" in entity) {
			let subEntity = this._getEntity(entity.classlist);
			if (subEntity) this._classlist = subEntity.content;
		}
	}

	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let table = document.createElement("table");
		table.id = this.idfmt(this._id);
		table.classList.add("stnl-table");
		parentEl.appendChild(table);
		if (entity.content.header) this._header(entity.content.header, table);
		if (entity.content.body) this._body(entity.content.body, table);
		if (entity.content.footer) this._footer(entity.content.footer, table);

		// TODO: "title" in entity -> caption

		return table;
	}

	private _header(id: EntityID, parentEl: HTMLElement): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of tableHeader: ${id}`);

		let thead = document.createElement("thead");
		thead.id = this.idfmt(id);
		parentEl.appendChild(thead);

		// Get header depth
		const getHeaderDepth = (entityId: EntityID): number => {
			let current = this._getEntity(entityId);
			if (!current) return 0;

			if (current.children) {
				let max = 0;
				current.children.forEach((childId: EntityID) => {
					let depth = getHeaderDepth(childId) + 1;
					if (max < depth) {
						thead.appendChild(document.createElement("tr"));
						max = depth;
					}
				});
				return max;
			} else {
				thead.appendChild(document.createElement("tr"));
				return 0;
			}
		};
		this._headerDepth = getHeaderDepth(id);

		if ("children" in entity && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			entity.children.forEach((childId: EntityID, order: number) => {
				let child = this._getEntity(childId);
				if (!child) return;
				if (child.type === "tableColumn") this._column(childId, thead, 0, order);
			});
		}
	}

	private _column(id: EntityID, parentEl: HTMLElement, row: number, col: number): number {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of tableColumn: ${id}`);

		let th = document.createElement("th");
		th.id = this.idfmt(id);
		th.innerHTML = entity.content;
		parentEl.children[row].appendChild(th);

		if ("action" in entity && entity.action) {
			this._setAction(id, th);
		}

		if (th.previousElementSibling) {
			if (th.previousElementSibling.hasAttribute("col")) {
				let column = th.previousElementSibling.getAttribute("col");
				if (column) col = parseInt(column, 10);
			}
			if (th.previousElementSibling.hasAttribute("colspan")) {
				let colspan = th.previousElementSibling.getAttribute("colspan");
				if (colspan) col += parseInt(colspan, 10);
			} else {
				col += 1;
			}
		}
		th.setAttribute("col", col.toString());
		th.setAttribute("row", row.toString());

		if (this._classlist && col < this._classlist.length) {
			th.classList.add.apply(th.classList, this._classlist[col]);
		}

		this._callback.call(this, th);

		if ("children" in entity && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			let max: number = 0;
			entity.children.forEach((childId: EntityID, order: number) => {
				let child = this._getEntity(childId);
				if (!child) return;

				if (child.type === "tableColumn") {
					let cols = this._column(childId, parentEl, row + 1, col + order) + 1;
					if (max < cols) max = cols;
				}
			});
			if (max > 1) th.setAttribute("colspan", max.toString());
			return max;
		} else {
			if (row < this._headerDepth - 1) th.setAttribute("rowspan", (this._headerDepth - row).toString());
			return 1;
		}
	}

	private _body(id: EntityID, parentEl: HTMLElement): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of tableBody: ${id}`);

		let tbody = document.createElement("tbody");
		tbody.id = this.idfmt(id);
		parentEl.appendChild(tbody);

		// Get row header depth
		const getHeaderDepth = (entityId: EntityID) => {
			let current = this._getEntity(entityId);
			if (!current) return 0;

			if ("children" in current && current.children.length) {
				let max = 0;
				current.children.forEach((childId: EntityID) => {
					let child = this._getEntity(childId);
					if (!child) return;

					if (child.type === "tableRowHeader") {
						let depth = getHeaderDepth(childId) + 1;
						if (max < depth) max = depth;
					}
				});
				return max;
			} else return 0;
		};
		this._rowHeaderDepth = getHeaderDepth(id);

		if ("children" in entity && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			entity.children.forEach((childId: EntityID, order: number) => {
				let child = this._getEntity(childId);
				if (!child) return;
				if (child.type === "tableRowHeader") this._rowHeader(childId, tbody, order, 0, false);
				else if (child.type === "tableRow") this._row(childId, tbody, order, 0, false);
			});
		}
	}

	private _rowHeader(id: EntityID, parentEl: HTMLElement, row: number, col: number, isFirstChild: boolean): number {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of tableRowHeader: ${id}`);

		if (!isFirstChild) {
			let tr = document.createElement("tr");
			parentEl.appendChild(tr);
			row = parentEl.children.length - 1;
		}

		let td = document.createElement("td");
		td.id = this.idfmt(id);
		td.innerHTML = entity.content;
		td.classList.add(this.clsfmt("row-header"));
		parentEl.children[row].appendChild(td);

		if ("action" in entity && entity.action) {
			this._setAction(id, td);
		}
		if ("help" in entity && entity.help) {
			td.setAttribute("title", entity.help);
		}

		td.setAttribute("row", row.toString());
		td.setAttribute("col", col.toString());

		if (this._classlist && col < this._classlist.length) {
			td.classList.add.apply(td.classList, this._classlist[col]);
		}

		this._callback.call(this, td);

		if ("children" in entity && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			let total = 0;
			entity.children.forEach((childId: EntityID, order: number) => {
				let child = this._getEntity(childId);
				if (!child) return;

				let colspan = 0;
				if (child.type !== "tableRowHeader") {
					colspan = this._rowHeaderDepth - col;
					td.setAttribute("colspan", colspan.toString());
				}
				let rows = 0;
				if (child.type === "tableRowHeader")
					rows = this._rowHeader(childId, parentEl, row, col + (colspan ? colspan : 1), order === 0);
				else if (child.type === "tableRow")
					rows = this._row(childId, parentEl, row, col + (colspan ? colspan : 1), order === 0);
				else throw new Error(`Invalid child entity: ${child.type}`);
				row += rows;
				total += rows;
			});
			if (total > 1) td.setAttribute("rowspan", total.toString());
			return total;
		} else return 1;
	}

	private _row(id: EntityID, parentEl: HTMLElement, row: number, col: number, isFirstChild: boolean): number {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of tableRow: ${id}`);

		if (!isFirstChild) {
			let tr = document.createElement("tr");
			tr.id = this.idfmt(id);
			parentEl.appendChild(tr);
		}

		if ("children" in entity && entity.children.length) {
			entity.children.forEach((childId: string, order: number) => {
				let child = this._getEntity(childId);
				if (!child) return;
				if (child.type === "tableCell") this._cell(childId, parentEl, row, col + order);
			});
		}
		return 1;
	}

	private _cell(id: EntityID, parentEl: HTMLElement, row: number, col: number): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of tableCell: ${id}`);

		let td = document.createElement("td");
		td.id = this.idfmt(id);
		parentEl.children[row].appendChild(td);

		if ("action" in entity && entity.action) {
			this._setAction(id, td);
		}
		if ("help" in entity && entity.help) {
			td.setAttribute("title", entity.help);
		}
		if ("highlight" in entity && entity.highlight) {
			let text = entity.content.replace(/\s*\([^)]*\)\s*/g, "");
			td.innerHTML = entity.content.substring(text.length);
			let highlight = document.createElement("strong");
			highlight.innerHTML = text;
			td.prepend(highlight);
		} else td.innerHTML = entity.content;

		td.setAttribute("row", row.toString());
		td.setAttribute("col", col.toString());

		if (this._classlist && col < this._classlist.length) {
			td.classList.add.apply(td.classList, this._classlist[col]);
		}

		this._callback.call(this, td);
	}

	private _footer(id: EntityID, parentEl: HTMLElement) {
		// TODO: footer
	}
}

type ColumnKey = string;

export class Ledger extends ContentEntity {
	// Record headers
	private _keys: Array<ColumnKey> = [];
	private _types: Record<ColumnKey, string> = {};

	// Records
	private _records: Array<EntityID> = [];

	// Column filters
	private _values: Record<ColumnKey, Array<any>> = {};
	private _mask: Array<Array<any>> = [];

	// Optional
	private _filter: Record<ColumnKey, string | null> = {};
	private _sort: Record<ColumnKey, string | null> = {};
	private _classlist: Record<ColumnKey, Array<string>> = {};

	constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback) {
		super(id, data, callback);

		let entity = this._getEntity(this._id);
		if (!entity) throw new Error(`Invalid identifier of ledger: ${this._id}`);

		// Entity inspection
		if ("content" in entity) {
			let content: Record<string, any> = entity.content;
			if (!("header" in content)) throw new Error(`Header is necessarily required: ${content.toString()}`);
			if (!("body" in content)) throw new Error(`Body is necessarily required: ${content.toString()}`);

			let header = this._getEntity(content.header);
			if (header) {
				if (!("content" in header)) throw new Error(`Incomplete header entity: ${header}`);
				Object.keys(header.content).forEach((key: ColumnKey) => {
					if (header) {
						this._keys.push(key);
						this._types[key] = header.content[key];
					}
				});
			} else throw new Error(`Invalid identifier of ledger header: ${content.header}`);

			let body = this._getEntity(content.body);
			if (body) {
				if (!("children" in body)) throw new Error(`Incomplete body entity: ${body}`);
				(<Array<ColumnKey>>body.children).forEach((id: ColumnKey) => {
					this._records.push(id);
				});
			} else throw new Error(`Invalid identifier of ledger body: ${content.body}`);
		} else throw new Error(`Incomplete entity: ${entity.toString()}`);

		// Properties
		if ("properties" in entity) {
			let propEntity = this._getEntity(entity.properties);
			if (propEntity) {
				let properties: Record<string, any> = propEntity.content;
				if ("display" in properties) {
					this._keys = [];
					(<Array<ColumnKey>>properties.display).forEach((key: ColumnKey) => {
						this._keys.push(key);
					});
				}
				if ("filter" in properties) {
					this._filter = properties.filter;
				}
				if ("sort" in properties) {
					this._sort = properties.sort;
					let option: Array<Record<string, string | null>> = [];
					for (const key of this._keys) {
						if (key in this._sort) {
							option.push({
								key: key,
								order: this._sort[key],
							});
						}
					}
					this.sort(option);
				}
			}
		}

		// Classlist
		this._keys.forEach((key: ColumnKey) => {
			this._classlist[key] = <Array<string>>[];
		});
		if ("classlist" in entity) {
			let subEntity = this._getEntity(entity.classlist);
			if (subEntity) this._classlist = subEntity.content;
		}

		// Mark as visible
		for (let i = 0; i < this._records.length; i++) {
			this._mask.push(new Array(this._keys.length));
			for (let j = 0; j < this._keys.length; j++) this._mask[i][j] = 1;
		}

		// Initialize column filter for auto completion on search
		for (const key of this._keys) this._values[key] = [];
	}

	public sort(option: Array<Record<string, string | null>>): void {
		if (!option || !option.length) return;
		this._records.sort((a: string, b: string) => {
			let compare = 0;
			for (let i = 0; i < option.length && compare == 0; i++) {
				let key = option[i].key;
				if (key) {
					let order = !option[i].order ? 0 : option[i].order === "ascending" ? 1 : -1;
					let entityA = this._getEntity(a);
					let entityB = this._getEntity(b);
					if (entityA && entityB) {
						let valueA = entityA.content[key];
						let valueB = entityB.content[key];
						compare = valueA === valueB ? 0 : (valueA > valueB ? 1 : -1) * order;
					}
				}
			}
			return compare;
		});
	}

	public render(parentEl: HTMLElement): HTMLElement | undefined {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);
		if (!entity) return undefined;

		let table = document.createElement("table");
		table.id = this.idfmt(this._id);
		table.classList.add(this.clsfmt("ledger"));
		parentEl.appendChild(table);

		if (entity.content.footer) this._footer(entity.content.footer, table);
		if (entity.content.body) this._body(entity.content.body, table);
		if (entity.content.header) this._header(entity.content.header, table);

		// TODO: "title" in entity -> caption

		return table;
	}

	private _header(id: EntityID, parentEl: HTMLElement): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of ledgerHeader: ${id}`);

		let thead = document.createElement("thead");
		thead.id = this.idfmt(id);
		parentEl.appendChild(thead);
		let tr = document.createElement("tr");
		thead.appendChild(tr);

		this._keys.forEach((key: ColumnKey, col: number) => {
			let th = document.createElement("th");
			th.setAttribute("row", "0");
			th.setAttribute("col", col.toString());
			tr.appendChild(th);

			let combobox = document.createElement("input");
			combobox.type = "text";
			combobox.id = this.idfmt(`combobox-${this._id}-${key}`);
			combobox.className = this.clsfmt("filter-combobox");
			combobox.title = key;
			combobox.placeholder = key;
			combobox.setAttribute("list", this.idfmt(`datalist-${this._id}-${key}`));
			combobox.setAttribute("col", col.toString());
			combobox.addEventListener("keydown", (e) => {
				e.stopPropagation();
				let el = <HTMLInputElement>e.target;
				if (el && e.key === "Escape") {
					el.value = "";
					el.dispatchEvent(new Event("input"));
				}
			});
			combobox.addEventListener("keypress", (e) => {
				e.stopPropagation();
			});
			combobox.addEventListener(
				"input",
				Debounce((e: Event) => {
					e.stopPropagation();
					let el = <HTMLInputElement>e.target;
					let ledger = this._getEntity(this._id);
					if (!ledger) return;

					let table = <HTMLTableElement>document.querySelector(`#${this.idfmt(this._id)}`);
					let tbody = table.querySelector("tbody");
					let tableRows = (<HTMLTableSectionElement>tbody).querySelectorAll("tr");
					let col = parseInt(<string>el.getAttribute("col"));

					// Reset masking
					tableRows.forEach((tr: HTMLTableRowElement, row: number) => {
						this._mask[row][col] = 1;
					});

					// Masking
					if (el.value.length) {
						el.setAttribute("list", "");
						tableRows.forEach((tr: HTMLTableRowElement, row: number) => {
							try {
								let regex = new RegExp(`${el.value}`, "gi");
								let str = (<HTMLTableDataCellElement>tr.childNodes[col]).innerText;
								let matches = str.match(regex);
								if (!matches || !matches.length) this._mask[row][col] = 0;
							} catch (e) {}

							// Exact match
							// if ((<HTMLTableDataCellElement>tr.childNodes[col]).innerText !== el.value)
							// 	this._mask[row][col] = 0;
						});
					} else {
						let regex = new RegExp(`^${this.idfmt("combobox")}`, "gi");
						el.setAttribute("list", el.id.replace(regex, this.idfmt("datalist")));
					}

					if (ledger.content.footer) {
						// Remove all children of `<table><tfoot><tr>`
						let footerRow = <HTMLTableRowElement>table.querySelector("tfoot > tr");
						while (footerRow && footerRow.lastChild) footerRow.removeChild(footerRow.lastChild);

						// Update statistics
						this._footer(ledger.content.footer, table);
					}

					// Reset column filter
					Object.keys(this._values).forEach((key: ColumnKey) => {
						this._values[key] = [];
					});

					// Hide filtered rows
					tableRows.forEach((tr, row) => {
						if (
							this._mask[row].reduce((a, b) => {
								return a * b;
							})
						) {
							tr.classList.remove("hidden");
							let recordId = this._records[row];
							this._keys.forEach((key: ColumnKey) => {
								let record = this._getEntity(recordId);
								if (!record) return;
								let filterValue = record.content[key];
								if (filterValue && this._values[key].indexOf(filterValue) < 0) this._values[key].push(filterValue);
							});
						} else {
							tr.classList.add("hidden");
						}
					});

					// Sort suggestion list of column filter
					Object.keys(this._values).forEach((key) => {
						if (key in this._sort) {
							this._values[key].sort((a, b) => {
								let order = !this._sort[key] ? 0 : this._sort[key] === "ascending" ? 1 : -1;
								return a == b ? 0 : (a > b ? 1 : -1) * order;
							});
						}
					});

					// Add options to datalist
					this._keys.forEach((key: ColumnKey, order: number) => {
						let datalistId = this.idfmt(`datalist-${this._id}-${key}`);
						let datalist = <HTMLDataListElement>document.querySelector(`#${datalistId}`);
						while (datalist && datalist.lastChild) datalist.removeChild(datalist.lastChild);
						this._values[key].forEach((value) => {
							let option = document.createElement("option");
							option.value = value;
							option.innerHTML = value;
							datalist.appendChild(option);
						});
					});

					//el.blur();
				}, 500)
			);
			th.appendChild(combobox);

			// Datalist
			let datalist = document.createElement("datalist");
			datalist.id = this.idfmt(`datalist-${this._id}-${key}`);
			th.appendChild(datalist);
			this._values[key].forEach((value) => {
				let option = document.createElement("option");
				option.value = value;
				option.innerHTML = value;
				datalist.appendChild(option);
			});
		});

		if (this._filter) {
			let comboboxes = parentEl.querySelectorAll(`.${this.clsfmt("filter-combobox")}`);
			if (comboboxes.length) {
				this._keys.forEach((key: ColumnKey, index: number) => {
					let value = this._filter[key];
					if (value) {
						let input = <HTMLInputElement>comboboxes[index];
						input.value = value;
						input.dispatchEvent(new Event("input"));
					}
				});
			}
		}
	}

	private _body(id: EntityID, parentEl: HTMLElement): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of ledgerBody: ${id}`);

		let tbody = document.createElement("tbody");
		tbody.id = this.idfmt(id);
		tbody.style.setProperty(`--${this.cssvarfmt("RowCounterId")}`, parentEl.id);
		parentEl.appendChild(tbody);

		this._records.forEach((childId: EntityID, order: number) => {
			let child = this._getEntity(childId);
			if (!child) return;
			if (child.type === "ledgerRecord") this._putRecord(childId, tbody);
		});

		// Sort suggestion list of column filter
		Object.keys(this._values).forEach((key) => {
			if (key in this._sort) {
				this._values[key].sort((a, b) => {
					let order = !this._sort[key] ? 0 : this._sort[key] === "ascending" ? 1 : -1;
					return a == b ? 0 : (a > b ? 1 : -1) * order;
				});
			}
		});
	}

	private _putRecord(id: EntityID, parentEl: HTMLElement): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) {
			console.log(`Invalid identifier of ledgerRecord: ${id}`);
			return;
		}

		let tr = document.createElement("tr");
		tr.id = this.idfmt(id);
		tr.style.setProperty(`--${this.cssvarfmt("RowCounterId")}`, parentEl.id);
		parentEl.appendChild(tr);

		for (const key of this._keys) {
			let td = document.createElement("td");
			tr.appendChild(td);
			let value = entity.content[key];

			if (this._types[key] === "number" || this._types[key] === "price") {
				if (!value) {
					td.innerHTML = "0";
				} else {
					if (this._types[key] === "price") td.innerHTML = value.toLocaleString();
					else td.innerHTML = value;
				}
			} else {
				if (value) td.innerHTML = value;
				else td.innerHTML = "";
			}
			if (this._classlist && this._classlist[key].length) {
				td.classList.add.apply(td.classList, this._classlist[key]);
			}

			// Make filter for each key
			if (value && this._values[key].indexOf(value) < 0) this._values[key].push(value);
		}
	}

	private _footer(id: EntityID, parentEl: HTMLElement): void {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);

		let entity = this._getEntity(id);
		if (!entity) throw new Error(`Invalid identifier of ledgerFooter: ${id}`);

		let tfoot: HTMLElement | null = parentEl.querySelector("tfoot");
		if (!tfoot) {
			tfoot = document.createElement("tfoot");
			tfoot.id = this.idfmt(id);
			parentEl.appendChild(tfoot);
		}
		let footerRow: HTMLElement | null = tfoot.querySelector("tr");
		if (!footerRow) {
			footerRow = document.createElement("tr");
			tfoot.appendChild(footerRow);
		}

		// Get column statistics
		for (const key of this._keys) {
			let type = entity.content[key] ? entity.content[key] : "";
			let td = document.createElement("td");
			td.setAttribute(this.attrfmt("footer-label"), type);
			footerRow.appendChild(td);

			if (type === "total") {
				let result = 0;
				this._records.forEach((childId: EntityID, order: number) => {
					let child = this._getEntity(childId);
					if (!child) return;
					if (
						this._mask[order].reduce((a: number, b: number) => {
							return a * b;
						})
					)
						result += child.content[key];
				});
				td.innerHTML = result.toLocaleString();
			} else if (type === "variety") {
				let result: Array<string> = [];
				this._records.forEach((childId: EntityID, order: number) => {
					let child = this._getEntity(childId);
					if (!child) return;
					if (
						this._mask[order].reduce((a: number, b: number) => {
							return a * b;
						})
					)
						result.push(child.content[key].toString());
				});
				td.innerHTML = [...new Set(Array.from(result))].length.toLocaleString();
			} else if (type === "count") {
				let result = 0;
				this._records.forEach((childId: EntityID, order: number) => {
					if (
						this._mask[order].reduce((a: number, b: number) => {
							return a * b;
						})
					)
						result += 1;
				});
				td.innerHTML = result.toLocaleString();
			}
		}
	}
}
