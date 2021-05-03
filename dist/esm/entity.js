export class Entity {
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
//# sourceMappingURL=entity.js.map