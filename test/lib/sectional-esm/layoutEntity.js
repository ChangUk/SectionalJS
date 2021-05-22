import { Entity } from "./entity.js";
import * as ContentEntities from "./contentEntity.js";
export class LayoutEntity extends Entity {
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
//# sourceMappingURL=layoutEntity.js.map