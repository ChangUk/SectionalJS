import type { EntityID, EntityRecord, Callback } from "./entity.js";
import { Entity } from "./entity.js";
import * as ContentEntities from "./contentEntity.js";

export class LayoutEntity extends Entity {
	constructor(id: EntityID, data: Record<EntityID, EntityRecord>, callback: Callback) {
		super(id, data, callback);
	}

	private _children(parentEl: HTMLElement, children: Array<string>, layout: Boolean) {
		if (!children) return;
		children.forEach((childId: string) => {
			let child = this._getEntity(childId);
			if (child) {
				let childType = child.type.toLowerCase();
				if (childType === "section") {
					this.section(childId, parentEl, layout);
				} else {
					let className: string = childType.replace(/^.{1}/g, (c: string) => c.toUpperCase());
					let entity = this._createContentEntity(className, childId);
					entity.render(parentEl);
				}
			}
		});
	}

	private _createContentEntity(clsname: string, id: EntityID) {
		const cls: any = ContentEntities;
		if (cls[clsname] && typeof cls[clsname] !== "undefined")
			return new cls[clsname](id, this._getData(), this._callback);
		else throw new Error("Class not found: " + clsname);
	}

	public article(id: EntityID, parentEl: HTMLElement, layout: Boolean = true): void {
		if (!id || !parentEl)
			throw new Error("Invalid parameters: article(id: string, parentEl: HTMLElement)");

		let entity = this._getEntity(id);
		if (!entity) return;
		if (entity.type !== "article") throw new Error(`Invalid entity type: ${entity.type}`);

		if (layout) {
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
		this._children(layout ? entity._dom : parentEl, entity.children, layout);
	}

	public section(id: EntityID, parentEl: HTMLElement, layout: Boolean = true): void {
		if (!id || !parentEl)
			throw new Error("Invalid parameters: section(id: string, parentEl: HTMLElement)");

		let entity = this._getEntity(id);
		if (!entity) return;
		if (entity.type !== "section") throw new Error(`Invalid entity type: ${entity.type}`);

		if (layout) {
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
		} else {
			if (entity.title) {
				let heading = document.createElement("h" + entity._depth);
				heading.id = this.idfmt(id);
				heading.innerHTML = entity.title;
				parentEl.appendChild(heading);
				this._callback.call(this, heading);
			}
		}
		this._children(layout ? entity._dom : parentEl, entity.children, layout);
	}
}
