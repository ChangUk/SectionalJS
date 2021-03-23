import { LayoutEntity } from "./layoutEntity.js";
export class Sectional {
    constructor(view, json, options) {
        this._callback = (e) => { };
        this._layout = true;
        if (!view || !json)
            throw new Error("Missing parameters!");
        this._viewport = view;
        this._data = json;
        // Set options
        if (options) {
            if ("callback" in options && typeof options.callback === "function")
                this._callback = options.callback;
            if ("insertLayouts" in options && typeof options.insertLayouts === "boolean")
                this._layout = options.insertLayouts;
        }
        const init = (id, parent, depth) => {
            if (!id)
                return;
            // Metadata
            let entity = this._data[id];
            if (!entity)
                throw new Error(`Invalid entity: ${id}`);
            entity._id = id;
            entity._depth = depth;
            if (parent) {
                if (!("_parent" in entity))
                    entity._parent = [];
                entity._parent.push(parent);
            }
            // Iterate through child entities
            if (entity.children) {
                entity.children.forEach((childId) => {
                    init(childId, id, depth + 1);
                });
            }
        };
        init(Sectional.ENTRY, "", 0);
    }
    static get ENTRY() {
        return "0000000000000000000000";
    }
    importData(data) {
        this._data = data;
    }
    exportData(removeMeta = true) {
        let deepCopied = JSON.parse(JSON.stringify(this._data));
        if (removeMeta) {
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
        if (id in this._data) {
            return false;
        }
        else {
            this._data[id] = record;
            return true;
        }
    }
    getArticles() {
        let entry = this._data[Sectional.ENTRY];
        if (entry)
            return entry.children;
        return [];
    }
    article(id) {
        this.clearViewport();
        let entity = new LayoutEntity(id, this._data, this._callback);
        entity.article(id, this._viewport, this._layout);
    }
    clearViewport() {
        while (this._viewport.lastChild)
            this._viewport.removeChild(this._viewport.lastChild);
    }
}
//# sourceMappingURL=sectional.js.map