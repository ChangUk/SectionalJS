(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Sectional = {}));
}(this, (function (exports) { 'use strict';

    class Entity {
        constructor(id, data, callback) {
            if (!id || !data || !(id in data))
                throw new Error(`Invalid parameters: ${id}, ${data}`);
            this._id = id;
            this._data = data;
            this._callback = typeof callback === "function" ? callback : (e) => { };
        }
        idfmt(id) {
            return `stnl-${id}`;
        }
        clsfmt(clsname) {
            return `stnl-${clsname}`;
        }
        cssvarfmt(varname) {
            return `stnl${varname}`;
        }
        attrfmt(attrname) {
            return `stnl-${attrname}`;
        }
        _getData() {
            return this._data;
        }
        _getEntity(id) {
            if (!id)
                return null;
            if (id in this._data) {
                let entity = this._data[id];
                // TODO: minimum requirements test
                return entity;
            }
            //throw new Error(`Invalid entity ID: ${id}`);
            return null;
        }
        static Template(type) {
            if (type in Entity.TEMPLATE)
                return Entity.TEMPLATE[type];
            else
                return null;
        }
    }
    Entity.TEMPLATE = {
        entry: { children: [], title: "", type: "entry" },
        article: { children: [], title: "", type: "article" },
        section: { children: [], title: "", type: "section" },
        paragraph: { content: "", title: "", type: "paragraph" },
        code: { content: "", language: "", type: "code" },
        table: { classlist: "", content: { header: "", body: "", footer: "" }, properties: "", title: "", type: "table" },
        tableHeader: { children: [], type: "tableHeader" },
        tableColumn: { content: "", type: "tableColumn" },
        tableBody: { children: [], type: "tableBody" },
        tableRowHeader: { children: [], content: "", type: "tableRowHeader" },
        tableRow: { children: [], type: "tableRow" },
        tableCell: { content: "", type: "tableCell" },
        ledger: { classlist: "", content: { header: "", body: "", footer: "" }, properties: "", title: "", type: "ledger" },
        ledgerHeader: { content: {}, type: "ledgerHeader" },
        ledgerBody: { children: [], type: "ledgerBody" },
        ledgerRecord: { content: {}, type: "ledgerRecord" },
        ledgerFooter: { children: [], type: "ledgerFooter" },
    };

    const Debounce = (func, wait, immediate = false) => {
        let timeout;
        return function (...args) {
            if (!timeout && immediate)
                func.apply(this, args);
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };
    class ContentEntity extends Entity {
        constructor(id, data, callback) {
            super(id, data, callback);
        }
        _setAction(id, el) {
            if (!id)
                return null;
            let entity = this._getEntity(id);
            if (!entity)
                return;
            el.classList.add(this.clsfmt("action"));
            el.addEventListener("click", (e) => {
                let target = e.target;
                if (target && target.hasAttribute("action")) {
                    let action = target.getAttribute("action");
                    if (action)
                        this._action(action);
                }
            });
            el.setAttribute("action", entity.action);
            let actionEntity = this._getEntity(entity.action);
            if (actionEntity && actionEntity.type === "url")
                el.setAttribute("title", actionEntity.content);
        }
        _action(id) {
            let entity = this._getEntity(id);
            if (!entity)
                return;
            if (entity.type === "url") {
                window.open(entity.content);
            }
            else if (entity.type === "dataurl") {
                let header = entity.content.split(",");
                let mime = header[0].match(/:(.*?);/)[1];
                let bstr = atob(header[1]);
                let n = bstr.length;
                let ui8a = new Uint8Array(n);
                while (n--)
                    ui8a[n] = bstr.charCodeAt(n);
                window.open(URL.createObjectURL(new Blob([ui8a], { type: mime })));
            }
        }
    }
    class Paragraph extends ContentEntity {
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
            let p = document.createElement("p");
            p.id = this.idfmt(this._id);
            p.innerHTML = entity.content;
            parentEl.appendChild(p);
            this._callback.call(this, p);
            return p;
        }
    }
    class Image extends ContentEntity {
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
            let img = document.createElement("img");
            img.id = this.idfmt(this._id);
            img.src = entity.content;
            parentEl.appendChild(img);
            // TODO: options
            return img;
        }
    }
    class Code extends ContentEntity {
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
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
    class Ulist extends ContentEntity {
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
            let ul = document.createElement("ul");
            // TODO: listing
            return ul;
        }
    }
    class Olist extends ContentEntity {
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
            let ol = document.createElement("ol");
            // TODO: listing
            return ol;
        }
    }
    class Table extends ContentEntity {
        constructor(id, data, callback) {
            super(id, data, callback);
            this._headerDepth = 0;
            this._rowHeaderDepth = 0;
            // Optional
            this._classlist = [];
            let entity = this._getEntity(this._id);
            if (!entity)
                throw new Error(`Invalid identifier of table: ${this._id}`);
            // Entity inspection
            if ("content" in entity) {
                let content = entity.content;
                if (!("body" in content) || !this._getEntity(content.body))
                    throw new Error(`Body is necessarily required: ${content.toString()}`);
            }
            else
                throw new Error(`Incomplete entity: ${entity.toString()}`);
            if ("properties" in entity) {
                let subEntity = this._getEntity(entity.properties);
                if (subEntity) {
                    subEntity.content;
                    // TODO: properties (not defined yet)
                }
            }
            if ("classlist" in entity) {
                let subEntity = this._getEntity(entity.classlist);
                if (subEntity)
                    this._classlist = subEntity.content;
            }
        }
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
            let table = document.createElement("table");
            table.id = this.idfmt(this._id);
            table.classList.add("stnl-table");
            parentEl.appendChild(table);
            if (entity.content.header)
                this._header(entity.content.header, table);
            if (entity.content.body)
                this._body(entity.content.body, table);
            if (entity.content.footer)
                this._footer(entity.content.footer, table);
            // TODO: "title" in entity -> caption
            return table;
        }
        _header(id, parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of tableHeader: ${id}`);
            let thead = document.createElement("thead");
            thead.id = this.idfmt(id);
            parentEl.appendChild(thead);
            // Get header depth
            const getHeaderDepth = (entityId) => {
                let current = this._getEntity(entityId);
                if (!current)
                    return 0;
                if (current.children) {
                    let max = 0;
                    current.children.forEach((childId) => {
                        let depth = getHeaderDepth(childId) + 1;
                        if (max < depth) {
                            thead.appendChild(document.createElement("tr"));
                            max = depth;
                        }
                    });
                    return max;
                }
                else {
                    thead.appendChild(document.createElement("tr"));
                    return 0;
                }
            };
            this._headerDepth = getHeaderDepth(id);
            if ("children" in entity && entity.children.length) {
                // TODO: All types of children should be equal. Add checking logic here.
                entity.children.forEach((childId, order) => {
                    let child = this._getEntity(childId);
                    if (!child)
                        return;
                    if (child.type === "tableColumn")
                        this._column(childId, thead, 0, order);
                });
            }
        }
        _column(id, parentEl, row, col) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of tableColumn: ${id}`);
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
                    if (column)
                        col = parseInt(column, 10);
                }
                if (th.previousElementSibling.hasAttribute("colspan")) {
                    let colspan = th.previousElementSibling.getAttribute("colspan");
                    if (colspan)
                        col += parseInt(colspan, 10);
                }
                else {
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
                let max = 0;
                entity.children.forEach((childId, order) => {
                    let child = this._getEntity(childId);
                    if (!child)
                        return;
                    if (child.type === "tableColumn") {
                        let cols = this._column(childId, parentEl, row + 1, col + order) + 1;
                        if (max < cols)
                            max = cols;
                    }
                });
                if (max > 1)
                    th.setAttribute("colspan", max.toString());
                return max;
            }
            else {
                if (row < this._headerDepth - 1)
                    th.setAttribute("rowspan", (this._headerDepth - row).toString());
                return 1;
            }
        }
        _body(id, parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of tableBody: ${id}`);
            let tbody = document.createElement("tbody");
            tbody.id = this.idfmt(id);
            parentEl.appendChild(tbody);
            // Get row header depth
            const getHeaderDepth = (entityId) => {
                let current = this._getEntity(entityId);
                if (!current)
                    return 0;
                if ("children" in current && current.children.length) {
                    let max = 0;
                    current.children.forEach((childId) => {
                        let child = this._getEntity(childId);
                        if (!child)
                            return;
                        if (child.type === "tableRowHeader") {
                            let depth = getHeaderDepth(childId) + 1;
                            if (max < depth)
                                max = depth;
                        }
                    });
                    return max;
                }
                else
                    return 0;
            };
            this._rowHeaderDepth = getHeaderDepth(id);
            if ("children" in entity && entity.children.length) {
                // TODO: All types of children should be equal. Add checking logic here.
                entity.children.forEach((childId, order) => {
                    let child = this._getEntity(childId);
                    if (!child)
                        return;
                    if (child.type === "tableRowHeader")
                        this._rowHeader(childId, tbody, order, 0, false);
                    else if (child.type === "tableRow")
                        this._row(childId, tbody, order, 0, false);
                });
            }
        }
        _rowHeader(id, parentEl, row, col, isFirstChild) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of tableRowHeader: ${id}`);
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
                entity.children.forEach((childId, order) => {
                    let child = this._getEntity(childId);
                    if (!child)
                        return;
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
                    else
                        throw new Error(`Invalid child entity: ${child.type}`);
                    row += rows;
                    total += rows;
                });
                if (total > 1)
                    td.setAttribute("rowspan", total.toString());
                return total;
            }
            else
                return 1;
        }
        _row(id, parentEl, row, col, isFirstChild) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of tableRow: ${id}`);
            if (!isFirstChild) {
                let tr = document.createElement("tr");
                tr.id = this.idfmt(id);
                parentEl.appendChild(tr);
            }
            if ("children" in entity && entity.children.length) {
                entity.children.forEach((childId, order) => {
                    let child = this._getEntity(childId);
                    if (!child)
                        return;
                    if (child.type === "tableCell")
                        this._cell(childId, parentEl, row, col + order);
                });
            }
            return 1;
        }
        _cell(id, parentEl, row, col) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of tableCell: ${id}`);
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
            }
            else
                td.innerHTML = entity.content;
            td.setAttribute("row", row.toString());
            td.setAttribute("col", col.toString());
            if (this._classlist && col < this._classlist.length) {
                td.classList.add.apply(td.classList, this._classlist[col]);
            }
            this._callback.call(this, td);
        }
        _footer(id, parentEl) {
            // TODO: footer
        }
    }
    class Ledger extends ContentEntity {
        constructor(id, data, callback) {
            super(id, data, callback);
            // Record headers
            this._keys = [];
            this._types = {};
            // Records
            this._records = [];
            // Column filters
            this._values = {};
            this._mask = [];
            // Optional
            this._filter = {};
            this._sort = {};
            this._classlist = {};
            let entity = this._getEntity(this._id);
            if (!entity)
                throw new Error(`Invalid identifier of ledger: ${this._id}`);
            // Entity inspection
            if ("content" in entity) {
                let content = entity.content;
                if (!("header" in content))
                    throw new Error(`Header is necessarily required: ${content.toString()}`);
                if (!("body" in content))
                    throw new Error(`Body is necessarily required: ${content.toString()}`);
                let header = this._getEntity(content.header);
                if (header) {
                    if (!("content" in header))
                        throw new Error(`Incomplete header entity: ${header}`);
                    Object.keys(header.content).forEach((key) => {
                        if (header) {
                            this._keys.push(key);
                            this._types[key] = header.content[key];
                        }
                    });
                }
                else
                    throw new Error(`Invalid identifier of ledger header: ${content.header}`);
                let body = this._getEntity(content.body);
                if (body) {
                    if (!("children" in body))
                        throw new Error(`Incomplete body entity: ${body}`);
                    body.children.forEach((id) => {
                        this._records.push(id);
                    });
                }
                else
                    throw new Error(`Invalid identifier of ledger body: ${content.body}`);
            }
            else
                throw new Error(`Incomplete entity: ${entity.toString()}`);
            // Properties
            if ("properties" in entity) {
                let propEntity = this._getEntity(entity.properties);
                if (propEntity) {
                    let properties = propEntity.content;
                    if ("display" in properties) {
                        this._keys = [];
                        properties.display.forEach((key) => {
                            this._keys.push(key);
                        });
                    }
                    if ("filter" in properties) {
                        this._filter = properties.filter;
                    }
                    if ("sort" in properties) {
                        this._sort = properties.sort;
                        let option = [];
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
            this._keys.forEach((key) => {
                this._classlist[key] = [];
            });
            if ("classlist" in entity) {
                let subEntity = this._getEntity(entity.classlist);
                if (subEntity)
                    this._classlist = subEntity.content;
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
        sort(option) {
            if (!option || !option.length)
                return;
            this._records.sort((a, b) => {
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
        render(parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(this._id);
            if (!entity)
                return undefined;
            let table = document.createElement("table");
            table.id = this.idfmt(this._id);
            table.classList.add(this.clsfmt("ledger"));
            parentEl.appendChild(table);
            if (entity.content.footer)
                this._footer(entity.content.footer, table);
            if (entity.content.body)
                this._body(entity.content.body, table);
            if (entity.content.header)
                this._header(entity.content.header, table);
            // TODO: "title" in entity -> caption
            return table;
        }
        _header(id, parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of ledgerHeader: ${id}`);
            let thead = document.createElement("thead");
            thead.id = this.idfmt(id);
            parentEl.appendChild(thead);
            let tr = document.createElement("tr");
            thead.appendChild(tr);
            this._keys.forEach((key, col) => {
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
                    let el = e.target;
                    if (el && e.key === "Escape") {
                        el.value = "";
                        el.dispatchEvent(new Event("input"));
                    }
                });
                combobox.addEventListener("keypress", (e) => {
                    e.stopPropagation();
                });
                combobox.addEventListener("input", Debounce((e) => {
                    e.stopPropagation();
                    let el = e.target;
                    let ledger = this._getEntity(this._id);
                    if (!ledger)
                        return;
                    let table = document.querySelector(`#${this.idfmt(this._id)}`);
                    let tbody = table.querySelector("tbody");
                    let tableRows = tbody.querySelectorAll("tr");
                    let col = parseInt(el.getAttribute("col"));
                    // Reset masking
                    tableRows.forEach((tr, row) => {
                        this._mask[row][col] = 1;
                    });
                    // Masking
                    if (el.value.length) {
                        el.setAttribute("list", "");
                        tableRows.forEach((tr, row) => {
                            try {
                                let regex = new RegExp(`${el.value}`, "gi");
                                let str = tr.childNodes[col].innerText;
                                let matches = str.match(regex);
                                if (!matches || !matches.length)
                                    this._mask[row][col] = 0;
                            }
                            catch (e) { }
                            // Exact match
                            // if ((<HTMLTableDataCellElement>tr.childNodes[col]).innerText !== el.value)
                            // 	this._mask[row][col] = 0;
                        });
                    }
                    else {
                        let regex = new RegExp(`^${this.idfmt("combobox")}`, "gi");
                        el.setAttribute("list", el.id.replace(regex, this.idfmt("datalist")));
                    }
                    if (ledger.content.footer) {
                        // Remove all children of `<table><tfoot><tr>`
                        let footerRow = table.querySelector("tfoot > tr");
                        while (footerRow && footerRow.lastChild)
                            footerRow.removeChild(footerRow.lastChild);
                        // Update statistics
                        this._footer(ledger.content.footer, table);
                    }
                    // Reset column filter
                    Object.keys(this._values).forEach((key) => {
                        this._values[key] = [];
                    });
                    // Hide filtered rows
                    tableRows.forEach((tr, row) => {
                        if (this._mask[row].reduce((a, b) => {
                            return a * b;
                        })) {
                            tr.classList.remove("hidden");
                            let recordId = this._records[row];
                            this._keys.forEach((key) => {
                                let record = this._getEntity(recordId);
                                if (!record)
                                    return;
                                let filterValue = record.content[key];
                                if (filterValue && this._values[key].indexOf(filterValue) < 0)
                                    this._values[key].push(filterValue);
                            });
                        }
                        else {
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
                    this._keys.forEach((key, order) => {
                        let datalistId = this.idfmt(`datalist-${this._id}-${key}`);
                        let datalist = document.querySelector(`#${datalistId}`);
                        while (datalist && datalist.lastChild)
                            datalist.removeChild(datalist.lastChild);
                        this._values[key].forEach((value) => {
                            let option = document.createElement("option");
                            option.value = value;
                            option.innerHTML = value;
                            datalist.appendChild(option);
                        });
                    });
                    //el.blur();
                }, 500));
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
                    this._keys.forEach((key, index) => {
                        let value = this._filter[key];
                        if (value) {
                            let input = comboboxes[index];
                            input.value = value;
                            input.dispatchEvent(new Event("input"));
                        }
                    });
                }
            }
        }
        _body(id, parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of ledgerBody: ${id}`);
            let tbody = document.createElement("tbody");
            tbody.id = this.idfmt(id);
            tbody.style.setProperty(`--${this.cssvarfmt("RowCounterId")}`, parentEl.id);
            parentEl.appendChild(tbody);
            this._records.forEach((childId, order) => {
                let child = this._getEntity(childId);
                if (!child)
                    return;
                if (child.type === "ledgerRecord")
                    this._putRecord(childId, tbody);
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
        _putRecord(id, parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
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
                    }
                    else {
                        if (this._types[key] === "price")
                            td.innerHTML = value.toLocaleString();
                        else
                            td.innerHTML = value;
                    }
                }
                else {
                    if (value)
                        td.innerHTML = value;
                    else
                        td.innerHTML = "";
                }
                if (this._classlist && this._classlist[key].length) {
                    td.classList.add.apply(td.classList, this._classlist[key]);
                }
                // Make filter for each key
                if (value && this._values[key].indexOf(value) < 0)
                    this._values[key].push(value);
            }
        }
        _footer(id, parentEl) {
            if (!parentEl)
                throw new Error(`Invalid "parentEl": ${parentEl}`);
            let entity = this._getEntity(id);
            if (!entity)
                throw new Error(`Invalid identifier of ledgerFooter: ${id}`);
            let tfoot = parentEl.querySelector("tfoot");
            if (!tfoot) {
                tfoot = document.createElement("tfoot");
                tfoot.id = this.idfmt(id);
                parentEl.appendChild(tfoot);
            }
            let footerRow = tfoot.querySelector("tr");
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
                    this._records.forEach((childId, order) => {
                        let child = this._getEntity(childId);
                        if (!child)
                            return;
                        if (this._mask[order].reduce((a, b) => {
                            return a * b;
                        }))
                            result += child.content[key];
                    });
                    td.innerHTML = result.toLocaleString();
                }
                else if (type === "variety") {
                    let result = [];
                    this._records.forEach((childId, order) => {
                        let child = this._getEntity(childId);
                        if (!child)
                            return;
                        if (this._mask[order].reduce((a, b) => {
                            return a * b;
                        }))
                            result.push(child.content[key].toString());
                    });
                    td.innerHTML = [...new Set(Array.from(result))].length.toLocaleString();
                }
                else if (type === "count") {
                    let result = 0;
                    this._records.forEach((childId, order) => {
                        if (this._mask[order].reduce((a, b) => {
                            return a * b;
                        }))
                            result += 1;
                    });
                    td.innerHTML = result.toLocaleString();
                }
            }
        }
    }

    var ContentEntities = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ContentEntity: ContentEntity,
        Paragraph: Paragraph,
        Image: Image,
        Code: Code,
        Ulist: Ulist,
        Olist: Olist,
        Table: Table,
        Ledger: Ledger
    });

    class LayoutEntity extends Entity {
        constructor(id, data, callback) {
            super(id, data, callback);
        }
        _children(parentEl, children, layout) {
            if (!children)
                return;
            children.forEach((childId) => {
                let child = this._getEntity(childId);
                if (child) {
                    let childType = child.type.toLowerCase();
                    if (childType === "section") {
                        this.section(childId, parentEl, layout);
                    }
                    else {
                        let className = childType.replace(/^.{1}/g, (c) => c.toUpperCase());
                        let entity = this._createContentEntity(className, childId);
                        entity.render(parentEl);
                    }
                }
            });
        }
        _createContentEntity(clsname, id) {
            const cls = ContentEntities;
            if (cls[clsname] && typeof cls[clsname] !== "undefined")
                return new cls[clsname](id, this._getData(), this._callback);
            else
                throw new Error("Class not found: " + clsname);
        }
        article(id, parentEl, insertSections = true) {
            if (!id || !parentEl)
                throw new Error("Invalid parameters: article(id: string, parentEl: HTMLElement)");
            let entity = this._getEntity(id);
            if (!entity)
                return;
            if (entity.type !== "article")
                throw new Error(`Invalid entity type: ${entity.type}`);
            if (insertSections) {
                let article = document.createElement("article");
                article.id = this.idfmt(id);
                parentEl.appendChild(article);
                entity._dom = article;
                if (entity.title) {
                    let heading = document.createElement("h1");
                    heading.id = this.idfmt(id);
                    heading.innerHTML = entity.title;
                    article.appendChild(heading);
                }
            }
            this._children(insertSections ? entity._dom : parentEl, entity.children, insertSections);
        }
        section(id, parentEl, insertSections = true) {
            if (!id || !parentEl)
                throw new Error("Invalid parameters: section(id: string, parentEl: HTMLElement)");
            let entity = this._getEntity(id);
            if (!entity)
                return;
            if (entity.type !== "section")
                throw new Error(`Invalid entity type: ${entity.type}`);
            if (insertSections) {
                let section = document.createElement("section");
                parentEl.appendChild(section);
                entity._dom = section;
                if (entity.title) {
                    let heading = document.createElement("h" + entity._depth);
                    heading.id = this.idfmt(id);
                    heading.innerHTML = entity.title;
                    section.appendChild(heading);
                    section.setAttribute("area-label", entity.title);
                    this._callback.call(this, heading);
                }
            }
            else {
                if (entity.title) {
                    let heading = document.createElement("h" + entity._depth);
                    heading.id = this.idfmt(id);
                    heading.innerHTML = entity.title;
                    parentEl.appendChild(heading);
                    this._callback.call(this, heading);
                }
            }
            this._children(insertSections ? entity._dom : parentEl, entity.children, insertSections);
        }
    }

    class Sectional {
        constructor(view, json, options) {
            // Options
            this._callback = (e) => { };
            this._insertSections = true;
            this._entry = "0000000000000000000000";
            if (!view || !json)
                throw new Error("Missing parameters!");
            this._viewport = view;
            this._data = json;
            // Set options
            if (options) {
                if ("callback" in options && typeof options.callback === "function")
                    this._callback = options.callback;
                if ("insertSections" in options && typeof options.insertSections === "boolean")
                    this._insertSections = options.insertSections;
                if ("entry" in options && typeof options.entry === "string")
                    this._entry = options.entry;
            }
            const init = (id, parent, depth) => {
                if (!id)
                    return;
                // Set metadata
                let entity = this._data[id];
                if (!entity)
                    return;
                entity._id = id;
                entity._depth = depth;
                if (parent) {
                    if (!("_parents" in entity))
                        entity._parents = [];
                    if (!entity._parents.includes(parent))
                        entity._parents.push(parent);
                }
                // Necessary properties
                if ("children" in entity) {
                    entity.children.forEach((childId) => {
                        init(childId, id, depth + 1);
                    });
                }
                if ("content" in entity && typeof entity.content === "object") {
                    if ("header" in entity.content)
                        init(entity.content.header, id, depth + 1);
                    if ("body" in entity.content)
                        init(entity.content.body, id, depth + 1);
                    if ("footer" in entity.content)
                        init(entity.content.footer, id, depth + 1);
                }
                // Optional properties
                if ("classlist" in entity) {
                    init(entity.classlist, id, depth + 1);
                }
                if ("properties" in entity) {
                    init(entity.properties, id, depth + 1);
                }
                if ("action" in entity) {
                    init(entity.action, id, depth + 1);
                }
            };
            init(this._entry, "", 0);
        }
        getEntry() {
            return this._entry;
        }
        getData() {
            return this._data;
        }
        setData(data) {
            this._data = data;
        }
        exportData(removeMetadata = true) {
            let deepCopied = JSON.parse(JSON.stringify(this._data));
            if (removeMetadata) {
                Object.keys(deepCopied).forEach((id) => {
                    let entity = deepCopied[id];
                    for (const key of Object.keys(entity)) {
                        if (key.startsWith('_'))
                            delete entity[key];
                    }
                });
            }
            return deepCopied;
        }
        getEntity(id) {
            if (!(id in this._data))
                return null;
            return this._data[id];
        }
        setEntity(id, record) {
            try {
                this._data[id] = record;
                return true;
            }
            catch (e) {
                return false;
            }
        }
        setMetadata() {
            // let reference = (parent: EntityID | null, id: EntityID) => {
            // 	if (!id || id.length !== 22) return;
            // 	if (id in this._data) {
            // 		let entity = this._data[id];
            // 		if (entity) {
            // 			// Metadata
            // 			if (!("_parents" in entity)) entity._parents = new Array<EntityID>();
            // 			if (!entity._parents.contains(parent)) entity._parents.push(parent);
            // 			// Necessary properties
            // 			if (entity.children)
            // 				entity.children.forEach((childId: EntityID) => { reference(id, childId); });
            // 			if ("content" in entity && typeof entity.content === "object")
            // 				Object.keys(entity.content).forEach((key: string) => {
            // 					if (entity.content)
            // 					reference(id, entity.content[key]);
            // 				});
            // 			// Optional properties
            // 			if (entity.classlist)
            // 				reference(id, entity.classlist);
            // 			if (entity.properties)
            // 				reference(id, entity.properties);
            // 			if (entity.action)
            // 				reference(id, entity.action);
            // 		}
            // 	} else console.log(`--- Broken pointer: parent("${parent}") -> target("${id}")"`);
            // }
            // reference(null, this._entry);
        }
        removeEntity(id) {
            if (id && id in this._data) {
                let entity = this._data[id];
                if (entity) {
                    if ("children" in entity) {
                        entity.children;
                        // TODO: 
                    }
                }
                delete this._data[id];
                return true;
            }
            else {
                return false;
            }
        }
        cleanup() {
            // TODO: 
        }
        getArticles() {
            let rootEntity = this._data[this._entry];
            if (rootEntity)
                return rootEntity.children;
            return [];
        }
        article(id) {
            this.clearViewport();
            let entity = new LayoutEntity(id, this._data, this._callback);
            entity.article(id, this._viewport, this._insertSections);
        }
        clearViewport() {
            while (this._viewport.lastChild)
                this._viewport.removeChild(this._viewport.lastChild);
        }
    }

    exports.Sectional = Sectional;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
