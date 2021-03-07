type Callback = (el: HTMLElement, ...args: any[]) => void;
type EntityID = string;

export class ContentEntity {
	protected _id: EntityID;
	protected _data: Record<EntityID, Record<string, any>>;
	protected _callback: Callback;
	constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback) {
		if (!id || !data || !(id in data))
			throw new Error(`Invalid parameters: ${id}, ${data}`);
		this._id = id;
		this._data = data;
		this._callback = typeof callback === "function" ? callback : (e) => { };
	}

	protected _idfmt(id: EntityID): string {
		return `eid-${id}`;
	}

	private _propRequired(entityType: string): Array<string> {
		const requirements: Record<string, Array<string>> = {
			table: ["content.body"],
			tableHeader: ["children"],
			tableColumn: ["label"],
			tableBody: ["children"],
			tableRowHeader: ["children", "label"],
			tableRow: ["children"],
			tableCell: ["content"],

			spreadsheet: ["content.header", "content.body"],
			spreadsheetHeader: ["content"],
			spreadsheetBody: ["children"],
			spreadsheetFooter: ["content"],
			spreadsheetRecord: ["content"],

			classlist: ["content"],
			properties: ["content"]
		}
		return requirements[entityType];
	}

	protected _getEntity(id: EntityID): any {
		if (!id) return null;
		if (!(id in this._data))
			throw new Error(`Invalid entity ID: ${id}`);
		let entity = this._data[id];
		if (!entity.hasOwnProperty("type"))
			throw new Error(`Incomplete entity: ${entity.toString()}`);

		// TODO: minimum requirements test

		return entity;
	}
}

export class Paragraph extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);

		let p = document.createElement("p");
		p.id = this._idfmt(this._id);
		p.innerHTML = entity.content;
		parentEl.appendChild(p);
		this._callback.call(this, p);
		return p;
	}
}

export class Image extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);

		let img = document.createElement("img");

		// TODO: listing

		return img;
	}
}

export class Ulist extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);

		let ul = document.createElement("ul");

		// TODO: listing

		return ul;
	}
}

export class Olist extends ContentEntity {
	public render(parentEl: HTMLElement): HTMLElement {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);

		let ol = document.createElement("ol");

		// TODO: listing

		return ol;
	}
}

export class Table extends ContentEntity {
	// Optional
	private _classlist: Array<Array<string>> = [];

	constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback) {
		super(id, data, callback);
		let entity = this._getEntity(this._id);
		if (!entity) throw new Error(`Invalid table: ${this._id}`);

		// Entity inspection
		if (entity.hasOwnProperty("content")) {
			let content: Record<string, any> = entity.content;
			if (!content.hasOwnProperty("body") || !(content.body in this._data))
				throw new Error(`Body is necessarily required: ${content.toString()}`);
		} else throw new Error(`Incomplete entity: ${entity.toString()}`);

		// Properties
		if (entity.hasOwnProperty("properties") && entity.properties in this._data) {
			let properties: Record<string, any> = this._data[entity.properties].content;

			// TODO: properties (not defined yet)
		}

		// Classlist
		if (entity.hasOwnProperty("classlist") && entity.classlist in this._data) {
			this._classlist = this._data[entity.classlist].content;
		}
	}

	public render(parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);

		let table = document.createElement("table");
		table.id = this._idfmt(this._id);
		table.classList.add("stn-table");
		parentEl.appendChild(table);
		if (entity.content.header) this._header(entity.content.header, table);
		if (entity.content.body) this._body(entity.content.body, table);
		if (entity.content.footer) this._footer(entity.content.footer, table);

		return table;
	}

	private _header(id: EntityID, parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let thead = document.createElement("thead");
		thead.id = this._idfmt(id);
		parentEl.appendChild(thead);
		const getHeaderDepth = (eid: EntityID): number => {
			if (this._data[eid].children) {
				let max = 0;
				this._data[eid].children.forEach((childId: EntityID) => {
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
		let depth = getHeaderDepth(id);
		if (entity.hasOwnProperty("children") && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			entity.children.forEach((childId: EntityID, order: number) => {
				let childType = this._data[childId].type;
				if (childType === "tableColumn")
					this._column(childId, thead, depth, 0, order);
			});
		}
	}

	private _column(id: EntityID, parentEl: HTMLElement, depth: number, row: number, col: number) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let th = document.createElement("th");
		th.id = this._idfmt(id);
		th.innerHTML = entity.label;
		parentEl.children[row].appendChild(th);

		//if (entity.action) this.setAction(th, id);

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

		if (entity.hasOwnProperty("children") && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			let max: number = 0;
			entity.children.forEach((childId: EntityID, order: number) => {
				let childType = this._data[childId].type;
				if (childType === "tableColumn") {
					let cols = this._column(childId, parentEl, depth, row + 1, col + order) + 1;
					if (max < cols) max = cols;
				}
			});
			if (max > 1) th.setAttribute("colspan", max.toString());
			return max;
		} else {
			if (row < depth - 1) th.setAttribute("rowspan", (depth - row).toString());
			return 1;
		}
	}

	private _body(id: EntityID, parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let tbody = document.createElement("tbody");
		tbody.id = this._idfmt(id);
		parentEl.appendChild(tbody);
		const getHeaderDepth = (eid: EntityID) => {
			if (this._data[eid].children) {
				let max = 0;
				this._data[eid].children.forEach((childId: EntityID) => {
					let child = this._getEntity(childId);
					if (child.type === "tableRowHeader") {
						let depth = getHeaderDepth(childId) + 1;
						if (max < depth) max = depth;
					}
				});
				return max;
			} else return 0;
		};
		let depth = getHeaderDepth(id);
		if (entity.hasOwnProperty("children") && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			entity.children.forEach((childId: EntityID, order: number) => {
				let childType = this._data[childId].type;
				if (childType === "tableRowHeader")
					this._rowHeader(childId, tbody, depth, order, 0, false);
				else if (childType === "tableRow")
					this._row(childId, tbody, order, 0, false);
			});
		}
	}

	private _rowHeader(id: EntityID, parentEl: HTMLElement, depth: number, row: number, col: number, isFirstChild: boolean) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		if (!isFirstChild) {
			let tr = document.createElement("tr");
			parentEl.appendChild(tr);
			row = parentEl.children.length - 1;
		}

		let td = document.createElement("td");
		td.id = this._idfmt(id);
		if (entity.hasOwnProperty("title")) td.setAttribute("title", entity.title);
		td.innerHTML = entity.label;
		td.classList.add("row-header");
		parentEl.children[row].appendChild(td);

		// if (entity.action) this.setAction(td, id);

		td.setAttribute("row", row.toString());
		td.setAttribute("col", col.toString());

		if (this._classlist && col < this._classlist.length) {
			td.classList.add.apply(td.classList, this._classlist[col]);
		}

		this._callback.call(this, td);

		if (entity.hasOwnProperty("children") && entity.children.length) {
			// TODO: All types of children should be equal. Add checking logic here.

			let total = 0;
			entity.children.forEach((childId: EntityID, order: number) => {
				let child = this._getEntity(childId);

				let colspan = 0;
				if (child.type !== "tableRowHeader") {
					colspan = depth - col;
					td.setAttribute("colspan", colspan.toString());
				}
				let rows = 0;
				if (child.type === "tableRowHeader")
					rows = this._rowHeader(childId, parentEl, depth, row, col + (colspan ? colspan : 1), order === 0);
				else if (child.type === "tableRow")
					rows = this._row(childId, parentEl, row, col + (colspan ? colspan : 1), order === 0);
				else
					throw new Error(`"Invalid child entity: ${child.type}"`);
				row += rows;
				total += rows;
			});
			if (total > 1) td.setAttribute("rowspan", total.toString());
			return total;
		} else return 1;
	}

	private _row(id: EntityID, parentEl: HTMLElement, row: number, col: number, isFirstChild: boolean) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		if (!isFirstChild) {
			let tr = document.createElement("tr");
			tr.id = this._idfmt(id);
			parentEl.appendChild(tr);
		}

		if (entity.hasOwnProperty("children") && entity.children.length) {
			entity.children.forEach((childId: string, order: number) => {
				let child = this._getEntity(childId);
				if (child.type === "tableCell")
					this._cell(childId, parentEl, row, col + order);
			});
		}
		return 1;
	}

	private _cell(id: EntityID, parentEl: HTMLElement, row: number, col: number) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let td = document.createElement("td");
		td.id = this._idfmt(id);
		parentEl.children[row].appendChild(td);

		// if (entity.action) this.setAction(td, id);

		if (entity.hasOwnProperty("highlight") && entity.highlight) {
			let text = entity.content.replace(/\s*\([^)]*\)\s*/g, "");
			td.innerHTML = entity.content.substring(text.length);
			let highlight = document.createElement("strong");
			highlight.innerHTML = text;
			td.prepend(highlight);
		} else td.innerHTML = entity.content;

		if (entity.hasOwnProperty("label") && entity.label.length) {
			td.setAttribute("title", entity.label);
		}
		td.setAttribute("row", row.toString());
		td.setAttribute("col", col.toString());

		if (this._classlist && col < this._classlist.length) {
			td.classList.add.apply(td.classList, this._classlist[col]);
		}

		this._callback.call(this, td);
	}

	private _footer(id: EntityID, parentEl: HTMLElement) {

	}
}

type ColumnKey = string;

export class Spreadsheet extends ContentEntity {
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
		if (!entity) throw new Error(`Invalid spreadsheet: ${this._id}`);

		// Entity inspection
		if (entity.hasOwnProperty("content")) {
			let content: Record<string, any> = entity.content;
			if (!content.hasOwnProperty("header"))
				throw new Error(`Header is necessarily required: ${content.toString()}`);
			if (!content.hasOwnProperty("body") || !(content.body in this._data))
				throw new Error(`Body is necessarily required: ${content.toString()}`);

			let header = this._getEntity(content.header);
			if (header) {
				if (!header.hasOwnProperty("content"))
					throw new Error(`Incomplete header entity: ${header}`);
				Object.keys(header.content).forEach((key: ColumnKey) => {
					this._keys.push(key);
					this._types[key] = header.content[key];
				});
			} else throw new Error(`Invalid identifier of spreadsheet header: ${content.header}`);

			let body = this._getEntity(content.body);
			if (body) {
				if (!body.hasOwnProperty("children"))
					throw new Error(`Incomplete body entity: ${body}`);
				(<Array<ColumnKey>>body.children).forEach((id: ColumnKey) => {
					this._records.push(id);
				});
			} else throw new Error(`Invalid identifier of spreadsheet body: ${content.body}`);
		} else throw new Error(`Incomplete entity: ${entity.toString()}`);

		// Properties
		if (entity.hasOwnProperty("properties") && entity.properties in this._data) {
			let properties: Record<string, any> = this._data[entity.properties].content;
			if (properties.hasOwnProperty("display")) {
				this._keys = [];
				(<Array<ColumnKey>>properties.display).forEach((key: ColumnKey) => {
					this._keys.push(key);
				});
			}
			if (properties.hasOwnProperty("filter")) {
				this._filter = properties.filter;
			}
			if (properties.hasOwnProperty("sort")) {
				this._sort = properties.sort;
				let option: Array<Record<string, string | null>> = [];
				for (const key of this._keys) {
					if (key in this._sort) {
						option.push({
							key: key,
							order: this._sort[key]
						});
					}
				}
				this.sort(option);
			}
		}

		// Classlist
		this._keys.forEach((key: ColumnKey) => { this._classlist[key] = <Array<string>>[]; });
		if (entity.hasOwnProperty("classlist") && entity.classlist in this._data) {
			this._classlist = this._data[entity.classlist].content;
		}

		// Mark as visible
		for (let i = 0; i < this._records.length; i++) {
			this._mask.push(new Array(this._keys.length));
			for (let j = 0; j < this._keys.length; j++)
				this._mask[i][j] = 1;
		}

		// Initialize column filter for auto completion on search
		for (const key of this._keys)
			this._values[key] = [];
	}

	public sort(option: Array<Record<string, string | null>>) {
		if (!option || !option.length) return;
		this._records.sort((a: string, b: string) => {
			let compare = 0;
			for (let i = 0; i < option.length && compare == 0; i++) {
				let key = option[i].key;
				if (key) {
					let order = (!option[i].order) ? 0 : (option[i].order === "ascending" ? 1 : -1);
					let value1 = this._data[a].content[key];
					let value2 = this._data[b].content[key];
					compare = (value1 === value2) ? 0 : (value1 > value2 ? 1 : -1) * order;
				}
			}
			return compare;
		});
	}

	public render(parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(this._id);

		let table = document.createElement("table");
		table.id = this._idfmt(this._id);
		table.classList.add("stn-spreadsheet");
		parentEl.appendChild(table);

		if (entity.content.footer) this._footer(entity.content.footer, table);
		if (entity.content.body) this._body(entity.content.body, table);
		if (entity.content.header) this._header(entity.content.header, table);

		return table;
	}

	private _header(id: EntityID, parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let thead = document.createElement("thead");
		thead.id = this._idfmt(id);
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
			combobox.id = `combobox-${this._id}-${key}`;
			combobox.className = "filter-combobox";
			combobox.title = key;
			combobox.placeholder = key;
			combobox.setAttribute("list", `datalist-${this._id}-${key}`);
			combobox.setAttribute("col", col.toString());
			combobox.addEventListener("keydown", (e) => {
				let el = <HTMLInputElement>e.target;
				e.stopPropagation();
				if (el && e.key === "Escape") {
					el.value = "";
					el.dispatchEvent(new Event("input"));
				}
			});
			combobox.addEventListener("keypress", (e) => {
				e.stopPropagation();
			});
			combobox.addEventListener("input", (e) => {
				e.stopPropagation();

				let el = <HTMLInputElement>e.target;
				let stylesheet = this._getEntity(this._id);
				let table = <HTMLTableElement>document.querySelector(`#${this._idfmt(this._id)}`);
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
							let regex = new RegExp(`${el.value}`, "g");
							let str = (<HTMLTableDataCellElement>tr.childNodes[col]).innerText;
							let matches = str.match(regex);
							if (!matches || !matches.length)
								this._mask[row][col] = 0;
						} catch (e) { }

						// Exact match
						// if ((<HTMLTableDataCellElement>tr.childNodes[col]).innerText !== el.value)
						// 	this._mask[row][col] = 0;
					});
				} else {
					el.setAttribute("list", el.id.replace(/^combobox/gi, "datalist"));
				}

				if (stylesheet.content.footer) {
					// Remove all children of `<table><tfoot><tr>`
					let footerRow = <HTMLTableRowElement>table.querySelector("tfoot > tr");
					while (footerRow && footerRow.lastChild) footerRow.removeChild(footerRow.lastChild);

					// Update statistics
					this._footer(stylesheet.content.footer, table);
				}

				// Reset column filter
				Object.keys(this._values).forEach((key: ColumnKey) => { this._values[key] = []; });

				// Hide filtered rows
				tableRows.forEach((tr, row) => {
					if (this._mask[row].reduce((a, b) => { return a * b; })) {
						tr.classList.remove("hidden");
						let recordId = this._records[row];
						this._keys.forEach((key: ColumnKey) => {
							let filterValue = this._data[recordId].content[key];
							if (filterValue && this._values[key].indexOf(filterValue) < 0)
								this._values[key].push(filterValue);
						});
					} else {
						tr.classList.add("hidden");
					}
				});

				// Sort suggestion list of column filter
				Object.keys(this._values).forEach((key) => {
					if (key in this._sort) {
						this._values[key].sort((a, b) => {
							let order = (!this._sort[key]) ? 0 : (this._sort[key] === "ascending" ? 1 : -1);
							return a == b ? 0 : (a > b ? 1 : -1) * order;
						});
					}
				});

				// Add options to datalist
				this._keys.forEach((key: ColumnKey, order: number) => {
					let datalist = <HTMLDataListElement>document.querySelector(`#datalist-${this._id}-${key}`);
					while (datalist && datalist.lastChild) datalist.removeChild(datalist.lastChild);
					this._values[key].forEach((value) => {
						let option = document.createElement("option");
						option.value = value;
						option.innerHTML = value;
						datalist.appendChild(option);
					});
				});

				//el.blur();
			});
			th.appendChild(combobox);

			// Datalist
			let datalist = document.createElement("datalist");
			datalist.id = `datalist-${this._id}-${key}`;
			th.appendChild(datalist);
			this._values[key].forEach((value) => {
				let option = document.createElement("option");
				option.value = value;
				option.innerHTML = value;
				datalist.appendChild(option);
			});
		});

		if (this._filter) {
			let comboboxes = parentEl.querySelectorAll(".stn-filter-combobox");
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

	private _body(id: EntityID, parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let tbody = document.createElement("tbody");
		tbody.id = this._idfmt(id);
		tbody.style.setProperty("--rowCounterId", parentEl.id);
		parentEl.appendChild(tbody);

		this._records.forEach((childId: EntityID, order: number) => {
			let entity = this._getEntity(childId);
			if (entity.type === "spreadsheetRecord")
				this._putRecord(childId, tbody);
		});

		// Sort suggestion list of column filter
		Object.keys(this._values).forEach((key) => {
			if (key in this._sort) {
				this._values[key].sort((a, b) => {
					let order = (!this._sort[key]) ? 0 : (this._sort[key] === "ascending" ? 1 : -1);
					return a == b ? 0 : (a > b ? 1 : -1) * order;
				});
			}
		});
	}

	private _putRecord(id: EntityID, parentEl: HTMLElement) {
		let entity = this._getEntity(id);

		let tr = document.createElement("tr");
		tr.id = this._idfmt(id);
		tr.style.setProperty("--rowCounterId", parentEl.id);
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

	private _footer(id: EntityID, parentEl: HTMLElement) {
		if (!parentEl) throw new Error(`Invalid "parentEl": ${parentEl}`);
		let entity = this._getEntity(id);

		let tfoot: HTMLElement | null = parentEl.querySelector("tfoot");
		if (!tfoot) {
			tfoot = document.createElement("tfoot");
			tfoot.id = this._idfmt(id);
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
			td.setAttribute("stn-footer-label", type);
			footerRow.appendChild(td);

			if (type === "total") {
				let result = 0;
				this._records.forEach((childId: EntityID, order: number) => {
					let child = this._getEntity(childId);
					if (this._mask[order].reduce((a: number, b: number) => { return a * b; }))
						result += child.content[key];
				});
				td.innerHTML = result.toLocaleString();
			} else if (type === "variety") {
				let result: Array<string> = [];
				this._records.forEach((childId: EntityID, order: number) => {
					let child = this._getEntity(childId);
					if (this._mask[order].reduce((a: number, b: number) => { return a * b; }))
						result.push(child.content[key].toString());
				});
				td.innerHTML = [...new Set(Array.from(result))].length.toLocaleString();
			} else if (type === "count") {
				let result = 0;
				this._records.forEach((childId: EntityID, order: number) => {
					if (this._mask[order].reduce((a: number, b: number) => { return a * b; }))
						result += 1;
				});
				td.innerHTML = result.toLocaleString();
			}
		}
	}
}
