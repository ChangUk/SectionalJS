import * as ContentEntity from "./contentEntity.js";
export class Sectional {
    constructor(dom, json, callback) {
        if (!dom || !json)
            throw new Error("Missing parameters!");
        this._viewport = dom;
        this._data = json;
        this._callback = typeof callback === "function" ? callback : (e) => { };
        this._init(Sectional.ENTRY, "", 0);
    }
    static get ENTRY() {
        return "0000000000000000000000";
    }
    _init(id, parent, depth) {
        // Metadata
        let entity = this._data[id];
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
                this._init(childId, id, depth + 1);
            });
        }
    }
    _createEntityInstance(classname, id) {
        const cls = ContentEntity;
        if (typeof cls[classname] !== "undefined")
            return new cls[classname](id, this._data, this._callback);
        else
            throw new Error("Class not found: " + classname);
    }
    _children(parentEl, children) {
        if (children) {
            children.forEach((childId) => {
                let child = this._data[childId];
                let childType = child.type.toLowerCase();
                if (childType === "article" || childType === "section") {
                    this[childType](childId, parentEl);
                }
                else {
                    let className = childType.replace(/^.{1}/g, (c) => c.toUpperCase());
                    let entity = this._createEntityInstance(className, childId);
                    entity.render(parentEl);
                }
            });
        }
    }
    article(id) {
        if (!id || !(id in this._data))
            throw new Error("Invalid parameter: article(id: string);");
        let entity = this._data[id];
        if (entity.type !== "article")
            throw new Error(`"Invalid type: ${entity.type}"`);
        this.clearViewport();
        let article = document.createElement("article");
        this._viewport.appendChild(article);
        entity._dom = article;
        if (entity.label) {
            // TODO: heading level 1
        }
        this._children(entity._dom, entity.children);
    }
    section(id, parentEl) {
        if (!id || !parentEl || !(id in this._data))
            throw new Error("Invalid parameters: section(id: string, parentId: string)");
        let entity = this._data[id];
        if (entity.type !== "section")
            throw new Error(`"Invalid type: ${entity.type}"`);
        let section = document.createElement("section");
        parentEl.appendChild(section);
        entity._dom = section;
        if (entity.label) {
            let heading = document.createElement("h" + entity._depth);
            heading.innerHTML = entity.label;
            section.appendChild(heading);
            section.setAttribute("area-label", entity.label);
            this._callback.call(this, heading);
        }
        this._children(entity._dom, entity.children);
    }
    clearViewport() {
        while (this._viewport.lastChild)
            this._viewport.removeChild(this._viewport.lastChild);
    }
}
//# sourceMappingURL=sectional.js.map